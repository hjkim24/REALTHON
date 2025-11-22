# chroma/list_collections_server.py
import chromadb

# ChromaDB HTTP 클라이언트로 연결
client = chromadb.HttpClient(host='localhost', port=8000)

try:
    # 모든 컬렉션 목록 조회
    collections = client.list_collections()
    
    print(f"✅ Found {len(collections)} collection(s):")
    print("=" * 60)
    
    for collection in collections:
        print(f"Collection Name: {collection.name}")
        print(f"  - ID: {collection.id}")
        print(f"  - Metadata: {collection.metadata}")
        
        # 컬렉션의 문서 개수 조회
        try:
            count = collection.count()
            print(f"  - Count: {count}")
        except Exception as e:
            print(f"  - Count: Unable to get count ({e})")
        
        print("-" * 60)
        
except Exception as e:
    print(f"❌ Error listing collections: {e}")
    import traceback
    traceback.print_exc()