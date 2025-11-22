// backend/src/recommend/recommend.service.ts

import { Document } from '@langchain/core/documents';
import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { EntityNotExistException } from 'libs/exception/src';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';

@Injectable()
export class RecommendService {
  constructor(
    private vector: VectorService,
    private prompt: PromptService,
    private llm: LLMService,
    private courseService: CourseService, // 추가
  ) {}

  async recommend(info: RecommendDto) {
    // 1) DB에서 사용자 수강 이력 가져오기
    const userCourses = await this.courseService.getUserCourses();

    // 2) 요청한 target_type에 맞는 카테고리 필터링
    const targetCategory =
      info.target_type === '교양' ? Category.General : Category.Major;

    // 3) 해당 카테고리에서 좋은 성적을 받은 과목들 찾기
    const highGradeCourses = userCourses.filter(
      (course) =>
        course.category === targetCategory &&
        (course.grade === 'A_PLUS' || course.grade === 'A'),
    );

    // 4) 초기 검색: 사용자가 좋은 성적을 받은 과목들 기반으로 검색
    let firstDocs: Array<Document<Record<string, any>>>;
    if (highGradeCourses.length > 0) {
      // 좋은 성적을 받은 과목들의 제목을 조합하여 검색
      const courseNames = highGradeCourses.map((c) => c.title).join(', ');
      firstDocs = await this.vector.initialSearch(courseNames);
    } else {
      // 없으면 기존 방식대로
      firstDocs = await this.vector.initialSearch(info.course);
    }

    // 5) 쿼리 재작성 - 사용자 수강 이력 정보 포함
    const refinePrompt = this.prompt.buildRefineQueryPrompt(
      firstDocs,
      info.grade,
      userCourses, // 추가: 사용자 수강 이력
      targetCategory, // 추가: 목표 카테고리
    );
    const refinedQuery = await this.llm.ask(refinePrompt);

    if (!refinedQuery) {
      throw new EntityNotExistException('refinedQuery');
    }

    // 6) 최종 검색
    const finalDocs = await this.vector.finalSearch(
      refinedQuery,
      info.target_type,
    );

    // 7) 최종 추천 생성 - 사용자 수강 이력 포함
    const finalPrompt = this.prompt.buildFinalPrompt(
      finalDocs,
      info,
      userCourses, // 추가: 사용자 수강 이력
    );
    const result = await this.llm.ask(finalPrompt);

    return {
      refinedQuery,
      recommendation: result,
      userCoursesCount: userCourses.length, // 추가: 통계 정보
    };
  }
}
