# check_collection.py
import chromadb
import os
from pathlib import Path
from dotenv import load_dotenv

# backend/.env 파일 경로 찾기 (embeddings.py와 동일한 방식)
_chroma_dir = Path(__file__).parent
_backend_dir = _chroma_dir.parent / "backend"
_env_file = _backend_dir / ".env"

# backend/.env 파일이 있으면 로드
if _env_file.exists():
    load_dotenv(_env_file)
    print(f"Loaded .env from: {_env_file}")
else:
    # 없으면 현재 디렉토리나 상위 디렉토리에서 .env 찾기
    load_dotenv()
    print("Loaded .env from current or parent directory")

# API 키 확인
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("⚠️  WARNING: OPENAI_API_KEY not found in environment")
else:
    print(f"✅ OPENAI_API_KEY is set (length: {len(api_key)})")

persist_directory = "./chroma_db"  # Python에서 사용하는 경로
client = chromadb.PersistentClient(path=persist_directory)

try:
    collection = client.get_collection(name="courses")
    print(f"✅ Collection 'courses' exists")
    
    # embedding function 확인
    # ChromaDB Python API에서 embedding function 정보 확인
    print(f"Collection metadata: {collection.metadata}")
    print(f"Collection count: {collection.count()}")
    
    # embedding function이 설정되어 있는지 확인
    # (ChromaDB 버전에 따라 방법이 다를 수 있음)
    try:
        # 컬렉션에 embedding function이 있는지 테스트
        test_result = collection.query(
            query_texts=["test"],
            n_results=1
        )
        print("✅ Embedding function is configured (can query with text)")
    except Exception as e:
        print(f"❌ Embedding function NOT configured: {e}")
        print("   Need to recreate collection with embedding function")
        
except Exception as e:
    print(f"❌ Collection 'courses' does not exist: {e}")