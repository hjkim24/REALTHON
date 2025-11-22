"""
RAG Pipeline - Step 2: VectorDB Search
Performs similarity search to find top-k relevant documents from vector database.
"""

from typing import List, Dict, Any, Optional
import os
import chromadb
from chromadb.config import Settings
import chromadb.utils.embedding_functions as embedding_functions


def search_vectordb(
    query_vector: List[float],
    collection_name: str = "documents",
    top_k: int = 5,
    persist_directory: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search vector database using similarity search to find top-k relevant documents.
    
    Args:
        query_vector: The embedding vector from the query (from Step 1)
        collection_name: Name of the collection to search in
        top_k: Number of top results to return (default: 5)
        persist_directory: Directory to persist the database (None for in-memory)
    
    Returns:
        List of dictionaries containing:
            - 'text': The document text content
            - 'metadata': Dictionary with document metadata
            - 'distance': Similarity distance (lower is more similar)
            - 'id': Document ID
    
    Example:
        >>> from embeddings import embedding
        >>> query = "Explain Fourier series simply"
        >>> query_vector = embedding(query)
        >>> results = search_vectordb(query_vector, top_k=5)
        >>> for result in results:
        ...     print(result['text'])
        ...     print(result['metadata'])
    """
    # Initialize ChromaDB client
    if persist_directory:
        client = chromadb.PersistentClient(path=persist_directory)
    else:
        client = chromadb.Client(Settings(anonymized_telemetry=False))
    
    # Get or create collection
    collection = client.get_or_create_collection(name=collection_name)
    
    # Perform similarity search
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        include=['metadatas', 'documents', 'distances']
    )
    
    # Format results
    formatted_results = []
    if results['ids'] and len(results['ids'][0]) > 0:
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'text': results['documents'][0][i] if results['documents'] else '',
                'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                'distance': results['distances'][0][i] if results['distances'] else None
            })
    
    return formatted_results


def add_documents_to_vectordb(
    texts: List[str],
    embeddings: List[List[float]],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    ids: Optional[List[str]] = None,
    collection_name: str = "documents",
    persist_directory: Optional[str] = None,
    clear_existing: bool = False,
    embedding_model: str = "text-embedding-ada-002",
    use_server: bool = False,
    server_host: str = "localhost",
    server_port: int = 8000
) -> None:
    """
    Add documents to the vector database.
    
    Args:
        texts: List of document texts
        embeddings: List of embedding vectors for each document
        metadatas: Optional list of metadata dictionaries for each document
        ids: Optional list of document IDs (auto-generated if not provided)
        collection_name: Name of the ChromaDB collection
        persist_directory: Directory to persist the database (used when use_server=False)
        clear_existing: If True, delete existing collection before adding (default: False)
        embedding_model: Embedding model to use (default: "text-embedding-ada-002")
        use_server: If True, use HTTP client to connect to ChromaDB server (default: False)
        server_host: ChromaDB server host (default: "localhost")
        server_port: ChromaDB server port (default: 8000)
    """
    # ChromaDB 클라이언트 초기화
    if use_server:
        # HTTP 서버 모드 (Docker 컨테이너 사용)
        client = chromadb.HttpClient(host=server_host, port=server_port)
    elif persist_directory:
        # 로컬 파일 시스템 모드 (기존 방식)
        client = chromadb.PersistentClient(path=persist_directory)
    else:
        # 인메모리 모드
        client = chromadb.Client(Settings(anonymized_telemetry=False))
    
    # Delete existing collection if clear_existing is True
    if clear_existing:
        try:
            client.delete_collection(name=collection_name)
            print(f"  Cleared existing '{collection_name}' collection")
        except Exception:
            # Collection doesn't exist, which is fine
            pass
    
    # OpenAI embedding function 설정
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variable")
    
    openai_ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=api_key,
        model_name=embedding_model
    )
    
    # Get or create collection
    collection = client.get_or_create_collection(name=collection_name, embedding_function=openai_ef)
    
    # Generate IDs if not provided
    if ids is None:
        ids = [f"doc_{i}" for i in range(len(texts))]
    
    # Add documents (will update if IDs already exist, unless collection was cleared)
    collection.add(
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas if metadatas else [{}] * len(texts),
        ids=ids
    )


if __name__ == "__main__":
    # Example usage
    from embeddings import embedding
    
    # Example: Search for documents
    query = "Explain Fourier series simply"
    query_vector = embedding(query)
    
    # Search the vector database
    results = search_vectordb(query_vector, top_k=5)
    
    print(f"Found {len(results)} results:")
    for i, result in enumerate(results, 1):
        print(f"\n--- Result {i} ---")
        print(f"ID: {result['id']}")
        print(f"Text: {result['text'][:200]}...")  # First 200 chars
        print(f"Metadata: {result['metadata']}")
        print(f"Distance: {result['distance']}")

