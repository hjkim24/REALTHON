# CourseFit

AI 기반 맞춤형 강의 추천 시스템

## 📋 프로젝트 소개

CourseFit은 학생의 성적표를 분석하여 개인화된 강의를 추천하는 AI 기반 웹 애플리케이션입니다. RAG(Retrieval-Augmented Generation) 기술을 활용하여 학생의 수강 이력과 성적을 바탕으로 최적의 강의를 추천합니다.

### 주요 기능

- 📸 **성적표 업로드**: 이미지 파일을 업로드하여 수강 이력 자동 추출
- 🤖 **AI 분석**: OpenAI를 활용한 성적표 정보 추출 및 분석
- 🔍 **벡터 검색**: ChromaDB를 통한 강의 정보 유사도 검색
- 💡 **맞춤형 추천**: 학생의 성적 패턴과 수강 이력을 분석하여 최적의 강의 3개 추천
- 📊 **전공/교양 분류**: 전공 및 교양 과목 분리 추천

## 🛠 기술 스택

### Backend

- **Framework**: [NestJS](https://nestjs.com/) (v11.0.1)
- **Language**: TypeScript (v5.7.3)
- **ORM**: [Prisma](https://www.prisma.io/) (v6.3.1)
- **Database**: PostgreSQL (v16-alpine)
- **AI/ML**:
  - [LangChain](https://js.langchain.com/) (v1.0.6)
  - [OpenAI](https://platform.openai.com/) (v6.9.1)
  - [ChromaDB](https://www.trychroma.com/) (v3.1.6)
- **Vector Database**: ChromaDB (Docker 컨테이너)
- **Validation**: class-validator, class-transformer

### Frontend

- **Framework**: [React](https://react.dev/) (v19.2.0)
- **Build Tool**: [Vite](https://vitejs.dev/) (v6.4.1)
- **Language**: TypeScript (v5.8.2)
- **UI Icons**: [Lucide React](https://lucide.dev/) (v0.554.0)

### Infrastructure

- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL (via Docker)
- **Vector Store**: ChromaDB (via Docker)

### Data Processing

- **Language**: Python 3
- **Libraries**: chromadb, openai

## 📁 프로젝트 구조

```
REALTHON/
├── backend/                 # NestJS 백엔드 애플리케이션
│   ├── src/
│   │   ├── recommend/      # 강의 추천 관련 모듈
│   │   │   ├── rag/        # RAG 구현 (Vector, Prompt, LLM 서비스)
│   │   │   ├── course.service.ts
│   │   │   ├── recommend.controller.ts
│   │   │   └── recommend.service.ts
│   │   └── main.ts
│   ├── prisma/             # Prisma 스키마 및 마이그레이션
│   └── docker-compose.yml  # Docker 서비스 설정
├── coursefit/              # React 프론트엔드 애플리케이션
│   ├── api/               # API 클라이언트
│   ├── components/        # React 컴포넌트
│   └── src/
└── chroma/                # ChromaDB 데이터 준비 스크립트
    ├── document/          # 강의 문서 데이터
    ├── embeddocument.py  # 문서 임베딩 생성
    ├── runner.py         # 데이터 처리 실행
    └── vectordb.py       # 벡터 DB 유틸리티
```

