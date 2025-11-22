"""
Chroma DB에서 특정 document의 metadata를 확인하는 스크립트
"""
import chromadb
from chromadb.config import Settings
from typing import Optional, List, Dict, Any


def get_document_metadata(
    document_id: Optional[str] = None,
    course_id: Optional[str] = None,
    collection_name: str = "courses",
    persist_directory: str = "./chroma_db"
) -> List[Dict[str, Any]]:
    """
    Chroma DB에서 특정 document의 metadata를 조회합니다.
    
    Args:
        document_id: 조회할 document ID (course_id와 동일)
        course_id: 조회할 course_id (document_id와 동일, 우선순위 높음)
        collection_name: ChromaDB collection 이름 (default: "courses")
        persist_directory: ChromaDB 저장 경로 (default: "./chroma_db")
    
    Returns:
        List of dictionaries containing document metadata
    """
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=persist_directory)
    
    # Get collection
    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        print(f"Error: Collection '{collection_name}' not found: {e}")
        return []
    
    # Use course_id if provided, otherwise use document_id
    query_id = course_id if course_id else document_id
    
    if query_id:
        # 특정 document ID로 조회
        try:
            results = collection.get(
                ids=[query_id],
                include=['metadatas', 'documents', 'embeddings']
            )
            
            if results['ids'] and len(results['ids']) > 0:
                documents = []
                for i in range(len(results['ids'])):
                    documents.append({
                        'id': results['ids'][i],
                        'metadata': results['metadatas'][i] if results['metadatas'] else {},
                        'document': results['documents'][i][:200] + '...' if results['documents'] and len(results['documents'][i]) > 200 else (results['documents'][i] if results['documents'] else ''),
                        'has_embedding': results['embeddings'] is not None and len(results['embeddings']) > 0
                    })
                return documents
            else:
                print(f"Document with ID '{query_id}' not found")
                return []
        except Exception as e:
            print(f"Error retrieving document: {e}")
            return []
    else:
        # 모든 document의 metadata 조회 (제한: 처음 10개)
        try:
            results = collection.get(
                limit=10,
                include=['metadatas', 'documents']
            )
            
            if results['ids'] and len(results['ids']) > 0:
                documents = []
                for i in range(len(results['ids'])):
                    documents.append({
                        'id': results['ids'][i],
                        'metadata': results['metadatas'][i] if results['metadatas'] else {},
                        'document_preview': results['documents'][i][:100] + '...' if results['documents'] and len(results['documents'][i]) > 100 else (results['documents'][i] if results['documents'] else '')
                    })
                return documents
            else:
                print("No documents found in collection")
                return []
        except Exception as e:
            print(f"Error retrieving documents: {e}")
            return []


def search_by_metadata(
    metadata_filter: Dict[str, Any],
    collection_name: str = "courses",
    persist_directory: str = "./chroma_db",
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Metadata 필터를 사용하여 document를 검색합니다.
    
    Args:
        metadata_filter: 검색할 metadata 조건 (예: {"course_id": "COSE212"})
        collection_name: ChromaDB collection 이름
        persist_directory: ChromaDB 저장 경로
        limit: 최대 반환 개수
    
    Returns:
        List of dictionaries containing matching documents
    """
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=persist_directory)
    
    # Get collection
    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        print(f"Error: Collection '{collection_name}' not found: {e}")
        return []
    
    try:
        # where 필터를 사용하여 metadata로 검색
        results = collection.get(
            where=metadata_filter,
            limit=limit,
            include=['metadatas', 'documents']
        )
        
        if results['ids'] and len(results['ids']) > 0:
            documents = []
            for i in range(len(results['ids'])):
                documents.append({
                    'id': results['ids'][i],
                    'metadata': results['metadatas'][i] if results['metadatas'] else {},
                    'document_preview': results['documents'][i][:200] + '...' if results['documents'] and len(results['documents'][i]) > 200 else (results['documents'][i] if results['documents'] else '')
                })
            return documents
        else:
            print(f"No documents found matching filter: {metadata_filter}")
            return []
    except Exception as e:
        print(f"Error searching by metadata: {e}")
        return []


if __name__ == "__main__":
    import sys
    
    # 사용 예시
    if len(sys.argv) > 1:
        # 커맨드라인 인자로 course_id 제공
        course_id = sys.argv[1]
        print(f"Looking up metadata for course_id: {course_id}\n")
        results = get_document_metadata(course_id=course_id)
    else:
        # 모든 document 조회 (처음 10개)
        print("Retrieving metadata for first 10 documents...\n")
        results = get_document_metadata()
    
    # 결과 출력
    if results:
        for i, doc in enumerate(results, 1):
            print(f"--- Document {i} ---")
            print(f"ID: {doc['id']}")
            print(f"Metadata: {doc['metadata']}")
            if 'document' in doc:
                print(f"Document (preview): {doc['document']}")
            elif 'document_preview' in doc:
                print(f"Document (preview): {doc['document_preview']}")
            print()
    else:
        print("No documents found")
    
    # 예시: 특정 course_id로 검색
    # print("\n--- Example: Search by course_id ---")
    # results = search_by_metadata({"course_id": "COSE212"})
    # for doc in results:
    #     print(f"ID: {doc['id']}, Metadata: {doc['metadata']}")

