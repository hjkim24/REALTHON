import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import type { Document } from '@langchain/core/documents';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VectorService {
  private vectordb: Chroma;
  private embedding: HuggingFaceInferenceEmbeddings;

  constructor() {
    this.embedding = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HF_API_KEY,
      model: 'sentence-transformers/all-mpnet-base-v2',
    });

    this.vectordb = new Chroma(this.embedding, {
      collectionName: 'course_embeddings',
    });
  }

  async initialSearch(
    course: string,
  ): Promise<Array<Document<Record<string, any>>>> {
    const query = `${course} 강의계획서 강의평 특징`;
    const queryEmbedding = await this.embedding.embedQuery(query);
    const results = await this.vectordb.similaritySearchVectorWithScore(
      queryEmbedding,
      3,
    );
    return results.map(([document]) => document);
  }

  async finalSearch(
    query: string,
    targetType: string,
  ): Promise<Array<Document<Record<string, any>>>> {
    const queryEmbedding = await this.embedding.embedQuery(query);
    const results = await this.vectordb.similaritySearchVectorWithScore(
      queryEmbedding,
      10,
      {
        type: targetType,
      } as Record<string, unknown>,
    );
    return results.map(([document]) => document);
  }

  /**
   * course_id로 특정 과목의 벡터를 찾는 메서드
   * @param courseId 학수번호 (course_id)
   * @returns Document와 embedding, 없으면 null
   */
  async findCourseVector(courseId: string): Promise<{
    document: Document<Record<string, any>>;
    embedding: number[];
  } | null> {
    try {
      // Chroma의 get 메서드를 사용하여 metadata로 필터링
      const results = await this.vectordb.similaritySearch('', 1, {
        where: { course_id: courseId },
      } as Record<string, unknown>);

      if (results.length === 0) {
        return null;
      }

      const document = results[0];
      // embedding을 가져오기 위해 직접 Chroma 클라이언트 접근이 필요할 수 있음
      // 일단 document를 반환하고, embedding은 similaritySearchVectorWithScore에서 가져올 수 있음
      const embedding = await this.embedding.embedQuery(document.pageContent);

      return {
        document,
        embedding,
      };
    } catch (error) {
      console.error(
        `Course vector not found for course_id: ${courseId}`,
        error,
      );
      return null;
    }
  }

  /**
   * 특정 course_id의 벡터와 유사한 과목들 찾기
   * @param courseId 학수번호
   * @param options 검색 옵션
   * @returns 유사도 점수와 함께 Document 배열
   */
  async findSimilarCourses(
    courseId: string,
    options: {
      limit?: number;
      excludeCourseIds?: string[];
      category?: string;
    } = {},
  ): Promise<
    Array<{ document: Document<Record<string, any>>; similarity: number }>
  > {
    const limit = options.limit || 10;
    const excludeCourseIds = options.excludeCourseIds || [];

    // 1. 해당 course_id의 벡터 찾기
    const courseVector = await this.findCourseVector(courseId);
    if (!courseVector) {
      return [];
    }

    // 2. 유사도 검색
    const results = await this.vectordb.similaritySearchVectorWithScore(
      courseVector.embedding,
      limit + excludeCourseIds.length, // 제외할 항목을 고려하여 더 많이 가져옴
    );

    // 3. 결과 필터링 및 변환
    const filteredResults = results
      .map(([document, score]) => ({
        document,
        similarity: score,
      }))
      .filter((result) => {
        const metadata = result.document.metadata;
        // 자기 자신 제외
        if (metadata.course_id === courseId) {
          return false;
        }
        // 제외할 course_id 목록에 있으면 제외
        const courseIdValue =
          typeof metadata.course_id === 'string'
            ? metadata.course_id
            : String(metadata.course_id);
        if (excludeCourseIds.includes(courseIdValue)) {
          return false;
        }
        // 카테고리 필터링 (옵션)
        if (options.category && metadata.type !== options.category) {
          return false;
        }
        return true;
      })
      .slice(0, limit); // 최종 limit만큼만 반환

    return filteredResults;
  }
}
