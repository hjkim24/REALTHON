// backend/src/recommend/recommend.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Category, Grade } from '@prisma/client';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';

interface RecommendedCourse {
  courseId: string;
  title: string;
  reason: string;
  similarity: number;
  metadata?: Record<string, any>;
}

interface LLMRecommendationResponse {
  recommendations: Array<{
    courseId: string;
    title: string;
    reason: string;
    similarity?: number;
  }>;
}

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    private vector: VectorService,
    private courseService: CourseService,
    private promptService: PromptService,
    private llmService: LLMService,
  ) {}

  async recommend(info: RecommendDto): Promise<{
    recommendations: RecommendedCourse[];
  }> {
    try {
      // 1) DB에서 사용자 수강 이력 가져오기
      this.logger.log('Fetching user courses...');
      const userCourses = await this.courseService.getUserCourses();

      // 2) 요청한 target_type에 맞는 카테고리 필터링
      const targetCategory =
        info.target_type === '교양' ? Category.General : Category.Major;

      // 3) 초기 검색 단계
      const courseQuery = info.course || '';
      this.logger.log(`Initial search for course: ${courseQuery}`);
      const firstDocs = await this.vector.initialSearch(courseQuery);

      if (firstDocs.length === 0) {
        this.logger.warn('No initial search results found');
        return {
          recommendations: [],
        };
      }

      // 4) 쿼리 개선 단계
      this.logger.log('Refining query with LLM...');
      const gradeValue = info.grade || '';
      const refinePrompt = this.promptService.buildRefineQueryPrompt(
        firstDocs,
        gradeValue,
        userCourses,
        targetCategory,
      );

      let refinedQuery: string;
      try {
        const refineResponse = await this.llmService.ask(refinePrompt);
        refinedQuery =
          (refineResponse && typeof refineResponse === 'string'
            ? refineResponse.trim()
            : null) || courseQuery;
        this.logger.log(`Refined query: ${refinedQuery}`);
      } catch (error) {
        this.logger.error('Failed to refine query, using original', error);
        refinedQuery = courseQuery;
      }

      // 5) 최종 검색 단계
      this.logger.log('Final search with refined query...');
      const finalDocs = await this.vector.finalSearch(
        refinedQuery,
        info.target_type,
      );

      if (finalDocs.length === 0) {
        this.logger.warn('No final search results found');
        return {
          recommendations: [],
        };
      }

      // 6) 추천 생성 단계
      this.logger.log('Generating recommendations with LLM...');
      const finalPrompt = this.promptService.buildFinalPrompt(
        finalDocs,
        info,
        userCourses,
      );

      // JSON 형식으로 응답 요청
      const jsonPrompt = `${finalPrompt}

위 정보를 바탕으로 다음 JSON 형식으로 추천 과목을 3개만 반환해주세요:
{
  "recommendations": [
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": 0.95
    },
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": 0.95
    },
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": 0.95
    }
  ]
}

반드시 정확히 3개의 추천 과목만 JSON 형식으로 반환해주세요. 다른 설명은 포함하지 마세요.`;

      let llmResponse: string | null = null;
      try {
        const response = await this.llmService.ask(jsonPrompt);
        llmResponse =
          response && typeof response === 'string' ? response : null;
        if (llmResponse) {
          this.logger.debug(`LLM Response: ${llmResponse}`);
        }
      } catch (error) {
        this.logger.error('Failed to generate recommendations with LLM', error);
        // Fallback: finalDocs에서 직접 추천 생성
        return {
          recommendations: this.fallbackRecommendations(finalDocs, userCourses),
        };
      }

      if (!llmResponse) {
        this.logger.warn('LLM response is empty, using fallback');
        return {
          recommendations: this.fallbackRecommendations(finalDocs, userCourses),
        };
      }

      // 7) JSON 파싱 및 변환
      const recommendations = this.parseLLMResponse(llmResponse, finalDocs);

      return {
        recommendations: recommendations.slice(0, 3), // 정확히 3개로 제한
      };
    } catch (error) {
      this.logger.error('Error in recommend service', error);
      // 최종 fallback: 빈 배열 반환
      return {
        recommendations: [],
      };
    }
  }

  /**
   * 성적별 가중치 계산
   * @param grade Grade enum
   * @returns 가중치 (0.0 ~ 1.0)
   */
  private getGradeWeight(grade: Grade): number {
    const weightMap: Record<Grade, number> = {
      [Grade.A_PLUS]: 1.0, // A+ = 최고 가중치
      [Grade.A]: 0.9,
      [Grade.B_PLUS]: 0.8,
      [Grade.B]: 0.7,
      [Grade.C_PLUS]: 0.6,
      [Grade.C]: 0.5,
      [Grade.D_PLUS]: 0.4,
      [Grade.D]: 0.3,
      [Grade.F]: 0.1, // F = 최저 가중치
      [Grade.P]: 0.5, // P = Pass (보통)
    };
    return weightMap[grade] || 0.5;
  }

  /**
   * LLM 응답을 파싱하여 RecommendedCourse 배열로 변환
   */
  private parseLLMResponse(
    llmResponse: string,
    finalDocs: Array<{ metadata: Record<string, any> }>,
  ): RecommendedCourse[] {
    try {
      // JSON 코드 블록 제거 (```json ... ```)
      let cleanedResponse = llmResponse.trim();
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/i, '');
        cleanedResponse = cleanedResponse.replace(/\n?```$/i, '');
      }

      const parsed = JSON.parse(cleanedResponse) as LLMRecommendationResponse;

      if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        this.logger.warn('Invalid LLM response format, using fallback');
        return this.fallbackRecommendations(finalDocs, []);
      }

      // finalDocs의 metadata를 사용하여 courseId와 title 매핑
      const docMap = new Map<
        string,
        { title: string; metadata: Record<string, any> }
      >();
      finalDocs.forEach((doc) => {
        const courseId =
          typeof doc.metadata.course_id === 'string'
            ? doc.metadata.course_id
            : String(doc.metadata.course_id || '');
        const title =
          (typeof doc.metadata.course_name === 'string'
            ? doc.metadata.course_name
            : null) ||
          (typeof doc.metadata.title === 'string'
            ? doc.metadata.title
            : null) ||
          courseId;

        docMap.set(courseId, { title, metadata: doc.metadata });
      });

      const recommendations: RecommendedCourse[] = parsed.recommendations
        .map((rec) => {
          const docInfo = docMap.get(rec.courseId);
          if (!docInfo) {
            // LLM이 반환한 courseId가 finalDocs에 없으면 스킵
            return null;
          }

          return {
            courseId: rec.courseId,
            title: rec.title || docInfo.title,
            reason: rec.reason || '추천 과목입니다.', // reason 추가
            similarity: rec.similarity ?? 0.9, // 기본값 0.9
            metadata: docInfo.metadata, // optional이므로 그대로 전달
          } as RecommendedCourse;
        })
        .filter((rec): rec is RecommendedCourse => rec !== null)
        .slice(0, 3); // 정확히 3개로 제한

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to parse LLM response', error);
      return this.fallbackRecommendations(finalDocs, []);
    }
  }

  /**
   * Fallback: finalDocs에서 직접 추천 생성
   */
  private fallbackRecommendations(
    finalDocs: Array<{ metadata: Record<string, any> }>,
    userCourses: Array<{ courseCode: string }>,
  ): RecommendedCourse[] {
    this.logger.log('Using fallback recommendations from finalDocs');

    const excludeCourseIds = new Set(
      userCourses.map((course) => course.courseCode),
    );

    return finalDocs
      .map((doc) => {
        const courseId =
          typeof doc.metadata.course_id === 'string'
            ? doc.metadata.course_id
            : String(doc.metadata.course_id || '');
        const title =
          (typeof doc.metadata.course_name === 'string'
            ? doc.metadata.course_name
            : null) ||
          (typeof doc.metadata.title === 'string'
            ? doc.metadata.title
            : null) ||
          courseId;

        return {
          courseId,
          title,
          reason: '검색 결과 기반 추천입니다.', // reason 추가
          similarity: 0.8, // 기본 유사도
          metadata: doc.metadata,
        };
      })
      .filter((rec) => !excludeCourseIds.has(rec.courseId))
      .slice(0, 3); // 정확히 3개로 제한
  }
}
