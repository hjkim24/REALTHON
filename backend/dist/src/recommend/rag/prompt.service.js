"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PromptService = class PromptService {
    buildRefineQueryPrompt(firstDocs, grade, userCourses, targetCategory) {
        let context = '';
        firstDocs.forEach((doc, i) => {
            context += `[Doc${i}] ${doc.pageContent.slice(0, 300)}\n`;
        });
        let userHistory = '';
        if (userCourses && userCourses.length > 0) {
            userHistory = `\n학생의 수강 이력 (총 ${userCourses.length}개 과목):\n`;
            userCourses.slice(0, 10).forEach((course) => {
                userHistory += `- ${course.title} (${course.courseCode}): ${course.grade}, ${course.category === client_1.Category.General ? '교양' : '전공'}\n`;
            });
        }
        return `
학생 성적: ${grade}
${targetCategory ? `목표 카테고리: ${targetCategory === client_1.Category.General ? '교양' : '전공'}` : ''}

아래 문서는 이 학생이 들은 과목의 특징입니다:
${context}
${userHistory}

이 정보를 기반으로, 학생에게 적합한 강의를 찾기 위한
검색 쿼리를 한 문장으로 만들어줘.
  `;
    }
    buildFinalPrompt(finalDocs, info, userCourses) {
        let context = '';
        finalDocs.forEach((doc, i) => {
            context += `[Doc${i}] ${doc.metadata.course} / ${doc.metadata.type}\n${doc.pageContent.slice(0, 300)}\n\n`;
        });
        let userSummary = '';
        if (userCourses && userCourses.length > 0) {
            const majorCount = userCourses.filter((c) => c.category === client_1.Category.Major).length;
            const generalCount = userCourses.filter((c) => c.category === client_1.Category.General).length;
            const avgGrade = userCourses.reduce((sum, c) => {
                const gradeValue = c.grade === 'A_PLUS'
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
};
exports.PromptService = PromptService;
exports.PromptService = PromptService = __decorate([
    (0, common_1.Injectable)()
], PromptService);
//# sourceMappingURL=prompt.service.js.map