// backend/src/recommend/recommend.service.ts

import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { VectorService } from './rag/vector.service';

interface RecommendedCourse {
  courseId: string;
  title: string;
  similarity: number;
  metadata: Record<string, any>;
}

@Injectable()
export class RecommendService {
  constructor(
    private vector: VectorService,
    private courseService: CourseService,
  ) {}

  async recommend(info: RecommendDto): Promise<{
    recommendedCourses: RecommendedCourse[];
    userCoursesCount: number;
  }> {
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

    // 4) 이미 수강한 과목의 courseCode 목록 (제외용)
    const excludeCourseIds = userCourses.map((course) => course.courseCode);

    // 5) 각 좋은 성적 과목에 대해 유사한 과목 찾기
    const allRecommendations: RecommendedCourse[] = [];

    if (highGradeCourses.length > 0) {
      // 각 과목별로 유사도 검색
      const similarityResults = await Promise.all(
        highGradeCourses.map(async (course) => {
          const results = await this.vector.findSimilarCourses(
            course.courseCode,
            {
              limit: 10,
              excludeCourseIds,
              category: info.target_type,
            },
          );

          return results.map((result) => {
            const courseId =
              typeof result.document.metadata.course_id === 'string'
                ? result.document.metadata.course_id
                : String(result.document.metadata.course_id);
            const title =
              (typeof result.document.metadata.title === 'string'
                ? result.document.metadata.title
                : null) || courseId;

            return {
              courseId,
              title,
              similarity: result.similarity,
              metadata: result.document.metadata,
            };
          });
        }),
      );

      // 모든 결과를 하나의 배열로 병합
      allRecommendations.push(...similarityResults.flat());
    } else {
      // 좋은 성적을 받은 과목이 없으면 빈 배열 반환
      return {
        recommendedCourses: [],
        userCoursesCount: userCourses.length,
      };
    }

    // 6) 중복 제거 및 유사도 기준 정렬
    const uniqueRecommendations = new Map<string, RecommendedCourse>();

    for (const rec of allRecommendations) {
      const existing = uniqueRecommendations.get(rec.courseId);
      if (!existing || rec.similarity > existing.similarity) {
        uniqueRecommendations.set(rec.courseId, rec);
      }
    }

    // 7) 유사도 기준으로 정렬 (높은 순)
    const sortedRecommendations = Array.from(uniqueRecommendations.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // 상위 20개만 반환

    return {
      recommendedCourses: sortedRecommendations,
      userCoursesCount: userCourses.length,
    };
  }
}
