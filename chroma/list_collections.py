# chroma/list_collections.py
import chromadb
from pathlib import Path

# chroma_db 디렉토리 경로
persist_directory = "./chroma_db"
client = chromadb.PersistentClient(path=persist_directory)

# 모든 컬렉션 목록 조회
try:
    collections = client.list_collections()
    print(f"✅ Found {len(collections)} collection(s):")
    print("=" * 60)
    for collection in collections:
        print(f"Collection Name: {collection.name}")
        print(f"  - ID: {collection.id}")
        print(f"  - Metadata: {collection.metadata}")
        print(f"  - Count: {collection.count()}")
        print("-" * 60)
except Exception as e:
    print(f"❌ Error listing collections: {e}")