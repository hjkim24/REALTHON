import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private readonly embeddings: OpenAIEmbeddings;
  private vectorStore: Chroma | null = null;
  private readonly collectionName = 'courses';
  private readonly chromaServerUrl: string;

  constructor() {
    // OpenAI 임베딩 모델 설정
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // ChromaDB 서버 URL 설정 (환경변수 또는 기본값)
    // Docker 컨테이너에서 실행 중인 ChromaDB 서버에 연결
    // - 호스트에서 실행: http://localhost:8000
    // - Docker 컨테이너 내부에서 실행: http://chromadb:8000
    this.chromaServerUrl =
      process.env.CHROMA_SERVER_URL || 'http://localhost:8000';

    this.logger.log(`ChromaDB server URL: ${this.chromaServerUrl}`);
  }

  /**
   * 모듈 초기화 시 실행
   */
  async onModuleInit() {
    this.logger.log('Initializing VectorService...');

    // Docker 컨테이너에서 실행 중인 ChromaDB 서버에 연결
    try {
      this.logger.log('Initializing vector store...');
      this.logger.log(
        `Connecting to ChromaDB server at: ${this.chromaServerUrl}`,
      );

      // LangChain Chroma 벡터 스토어 초기화
      // Docker Compose에서 ChromaDB 서버가 실행 중이며:
      // - 컨테이너 내부에서 /chroma/chroma를 데이터 저장 경로로 사용
      // - 로컬의 ../chroma/chroma_db 디렉토리가 마운트됨
      this.vectorStore = new Chroma(this.embeddings, {
        collectionName: this.collectionName,
        url: this.chromaServerUrl,
      });

      // 테스트 쿼리로 컬렉션 데이터 확인
      this.logger.log('Testing vector store connection...');
      const testResults = await this.vectorStore.similaritySearch('test', 1);
      this.logger.log(
        `Vector store initialized successfully. Found ${testResults.length} test result(s)`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize vector store', error);
      this.logger.warn('Vector store may not be properly configured');
      this.logger.warn(
        `Make sure ChromaDB server is running at ${this.chromaServerUrl}`,
      );
    }
  }

  /**
   * 초기 검색 (강의명 기반)
   * @param course 강의명
   * @returns Document 배열 (상위 3개 결과)
   */
  async initialSearch(course: string): Promise<Document[]> {
    try {
      if (!this.vectorStore) {
        this.logger.error('Vector store is not initialized');
        return [];
      }

      // 쿼리 생성
      const query = `${course} 강의계획서 강의평 특징`;

      this.logger.debug(`Initial search query: ${query}`);

      // 임베딩 생성 후 유사도 검색
      const results = await this.vectorStore.similaritySearch(query, 3);

      this.logger.log(`Initial search returned ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error('Error in initialSearch', error);
      return [];
    }
  }

  /**
   * 최종 검색 (사용자 쿼리 기반)
   * @param query 검색 쿼리
   * @param _targetType 사용하지 않음
   * @returns Document 배열 (상위 10개 결과)
   */
  async finalSearch(
    query: string,
    _targetType: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<Document[]> {
    try {
      if (!this.vectorStore) {
        this.logger.error('Vector store is not initialized');
        return [];
      }

      this.logger.debug(`Final search query: ${query}`);

      // 쿼리 임베딩 생성 후 유사도 검색
      const results = await this.vectorStore.similaritySearch(query, 10);

      this.logger.log(`Final search returned ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error('Error in finalSearch', error);
      return [];
    }
  }
}
