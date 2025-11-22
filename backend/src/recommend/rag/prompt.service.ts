import { Document } from '@langchain/core/documents';
import { Injectable } from '@nestjs/common';
import { Category, Grade } from '@prisma/client';
import { RecommendDto } from '../dto/recommend.dto';

@Injectable()
export class PromptService {
  buildRefineQueryPrompt(
    firstDocs: Array<Document<Record<string, any>>>,
    grade: string,
    userCourses?: Array<{
      id: number;
      title: string;
      courseCode: string;
      grade: Grade;
      category: Category;
    }>, // 추가
    targetCategory?: Category, // 추가
  ) {
    let context = '';

    firstDocs.forEach((doc, i) => {
      context += `[Doc${i}] ${doc.pageContent.slice(0, 300)}\n`;
    });

    // 사용자 수강 이력 정보 추가
    let userHistory = '';
    if (userCourses && userCourses.length > 0) {
      userHistory = `\n학생의 수강 이력 (총 ${userCourses.length}개 과목):\n`;
      userCourses.slice(0, 10).forEach((course) => {
        userHistory += `- ${course.title} (${course.courseCode}): ${course.grade}, ${course.category === Category.General ? '교양' : '전공'}\n`;
      });
    }

    return `
학생 성적: ${grade}
${targetCategory ? `목표 카테고리: ${targetCategory === Category.General ? '교양' : '전공'}` : ''}

아래 문서는 이 학생이 들은 과목의 특징입니다:
${context}
${userHistory}

이 정보를 기반으로, 학생에게 적합한 강의를 찾기 위한
검색 쿼리를 한 문장으로 만들어줘.
  `;
  }

  buildFinalPrompt(
    finalDocs: Array<Document<Record<string, any>>>,
    info: RecommendDto,
    userCourses?: Array<{
      id: number;
      title: string;
      courseCode: string;
      grade: Grade;
      category: Category;
    }>, // 추가
  ) {
    let context = '';

    finalDocs.forEach((doc, i) => {
      context += `[Doc${i}] ${doc.metadata.course} / ${doc.metadata.type}\n${doc.pageContent.slice(0, 300)}\n\n`;
    });

    // 사용자 수강 이력 요약
    let userSummary = '';
    if (userCourses && userCourses.length > 0) {
      const majorCount = userCourses.filter(
        (c) => c.category === Category.Major,
      ).length;
      const generalCount = userCourses.filter(
        (c) => c.category === Category.General,
      ).length;
      const avgGrade =
        userCourses.reduce((sum, c) => {
          const gradeValue =
            c.grade === 'A_PLUS'
              ? 4.5
              : c.grade === 'A'
                ? 4.0
                : c.grade === 'B_PLUS'
                  ? 3.5
                  : c.grade === 'B'
                    ? 3.0
                    : 0;
          return sum + gradeValue;
        }, 0) / userCourses.length;

      userSummary = `
학생 수강 이력:
- 총 수강 과목: ${userCourses.length}개
- 전공: ${majorCount}개, 교양: ${generalCount}개
- 평균 성적: ${avgGrade.toFixed(1)}
`;
    }

    return `
너는 대학 강의 추천 AI이다.

학생 정보:
- 과목: ${info.course}
- 성적: ${info.grade}
- 요청: ${info.target_type}
${userSummary}

참고 문서:
${context}

이 학생이 A를 받을 수 있는 강의 3개를 추천하고,
강의별 이유도 자세히 설명해줘.
  `;
  }
}
