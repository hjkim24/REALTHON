"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecommendService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const course_service_1 = require("./course.service");
const llm_service_1 = require("./llm/llm.service");
const prompt_service_1 = require("./rag/prompt.service");
const vector_service_1 = require("./rag/vector.service");
let RecommendService = RecommendService_1 = class RecommendService {
    constructor(vector, courseService, promptService, llmService) {
        this.vector = vector;
        this.courseService = courseService;
        this.promptService = promptService;
        this.llmService = llmService;
        this.logger = new common_1.Logger(RecommendService_1.name);
    }
    async recommend(info) {
        try {
            this.logger.log('Fetching user courses...');
            const userCourses = await this.courseService.getUserCourses();
            const targetCategory = info.target_type === '교양' ? client_1.Category.General : client_1.Category.Major;
            const courseQuery = info.course || '';
            this.logger.log(`Initial search for course: ${courseQuery}`);
            const firstDocs = await this.vector.initialSearch(courseQuery);
            if (firstDocs.length === 0) {
                this.logger.warn('No initial search results found');
                return {
                    recommendations: [],
                };
            }
            this.logger.log('Refining query with LLM...');
            const gradeValue = info.grade || '';
            const refinePrompt = this.promptService.buildRefineQueryPrompt(firstDocs, gradeValue, userCourses, targetCategory);
            let refinedQuery;
            try {
                const refineResponse = await this.llmService.ask(refinePrompt);
                refinedQuery =
                    (refineResponse && typeof refineResponse === 'string'
                        ? refineResponse.trim()
                        : null) || courseQuery;
                this.logger.log(`Refined query: ${refinedQuery}`);
            }
            catch (error) {
                this.logger.error('Failed to refine query, using original', error);
                refinedQuery = courseQuery;
            }
            this.logger.log('Final search with refined query...');
            const finalDocs = await this.vector.finalSearch(refinedQuery, info.target_type);
            if (finalDocs.length === 0) {
                this.logger.warn('No final search results found');
                return {
                    recommendations: [],
                };
            }
            this.logger.log('Generating recommendations with LLM...');
            const finalPrompt = this.promptService.buildFinalPrompt(finalDocs, info, userCourses);
            const jsonPrompt = `${finalPrompt}

위 정보를 바탕으로 다음 JSON 형식으로 추천 과목을 3개만 반환해주세요:
{
  "recommendations": [
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": "유사도(0~1)"
    },
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": "유사도(0~1)"
    },
    {
      "courseId": "학수번호",
      "title": "과목명",
      "reason": "추천 이유",
      "similarity": "유사도(0~1)"
    }
  ]
}

반드시 정확히 3개의 추천 과목만 JSON 형식으로 반환해주세요. 다른 설명은 포함하지 마세요.`;
            let llmResponse = null;
            try {
                const response = await this.llmService.ask(jsonPrompt);
                llmResponse =
                    response && typeof response === 'string' ? response : null;
                if (llmResponse) {
                    this.logger.debug(`LLM Response: ${llmResponse}`);
                }
            }
            catch (error) {
                this.logger.error('Failed to generate recommendations with LLM', error);
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
            const recommendations = this.parseLLMResponse(llmResponse, finalDocs, userCourses);
            return {
                recommendations: recommendations.slice(0, 3),
            };
        }
        catch (error) {
            this.logger.error('Error in recommend service', error);
            return {
                recommendations: [],
            };
        }
    }
    getGradeWeight(grade) {
        const weightMap = {
            [client_1.Grade.A_PLUS]: 1.0,
            [client_1.Grade.A]: 0.9,
            [client_1.Grade.B_PLUS]: 0.8,
            [client_1.Grade.B]: 0.7,
            [client_1.Grade.C_PLUS]: 0.6,
            [client_1.Grade.C]: 0.5,
            [client_1.Grade.D_PLUS]: 0.4,
            [client_1.Grade.D]: 0.3,
            [client_1.Grade.F]: 0.1,
            [client_1.Grade.P]: 0.5,
        };
        return weightMap[grade] || 0.5;
    }
    parseLLMResponse(llmResponse, finalDocs, userCourses) {
        try {
            let cleanedResponse = llmResponse.trim();
            if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/i, '');
                cleanedResponse = cleanedResponse.replace(/\n?```$/i, '');
            }
            const parsed = JSON.parse(cleanedResponse);
            if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
                this.logger.warn('Invalid LLM response format, using fallback');
                return this.fallbackRecommendations(finalDocs, []);
            }
            const docMap = new Map();
            finalDocs.forEach((doc) => {
                const courseId = typeof doc.metadata.course_id === 'string'
                    ? doc.metadata.course_id
                    : String(doc.metadata.course_id || '');
                const title = (typeof doc.metadata.course_name === 'string'
                    ? doc.metadata.course_name
                    : null) ||
                    (typeof doc.metadata.title === 'string'
                        ? doc.metadata.title
                        : null) ||
                    courseId;
                docMap.set(courseId, { title, metadata: doc.metadata });
            });
            const excludeCourseIds = new Set(userCourses.map((course) => course.courseCode));
            const recommendations = parsed.recommendations
                .map((rec) => {
                const docInfo = docMap.get(rec.courseId);
                if (!docInfo) {
                    return null;
                }
                return {
                    courseId: rec.courseId,
                    title: rec.title || docInfo.title,
                    reason: rec.reason || '추천 과목입니다.',
                    similarity: rec.similarity ?? 0.9,
                    metadata: docInfo.metadata,
                };
            })
                .filter((rec) => rec !== null)
                .filter((rec) => !excludeCourseIds.has(rec.courseId))
                .slice(0, 3);
            return recommendations;
        }
        catch (error) {
            this.logger.error('Failed to parse LLM response', error);
            return this.fallbackRecommendations(finalDocs, []);
        }
    }
    fallbackRecommendations(finalDocs, userCourses) {
        this.logger.log('Using fallback recommendations from finalDocs');
        const excludeCourseIds = new Set(userCourses.map((course) => course.courseCode));
        return finalDocs
            .map((doc) => {
            const courseId = typeof doc.metadata.course_id === 'string'
                ? doc.metadata.course_id
                : String(doc.metadata.course_id || '');
            const title = (typeof doc.metadata.course_name === 'string'
                ? doc.metadata.course_name
                : null) ||
                (typeof doc.metadata.title === 'string'
                    ? doc.metadata.title
                    : null) ||
                courseId;
            return {
                courseId,
                title,
                reason: '검색 결과 기반 추천입니다.',
                similarity: 0.8,
                metadata: doc.metadata,
            };
        })
            .filter((rec) => !excludeCourseIds.has(rec.courseId))
            .slice(0, 3);
    }
};
exports.RecommendService = RecommendService;
exports.RecommendService = RecommendService = RecommendService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vector_service_1.VectorService,
        course_service_1.CourseService,
        prompt_service_1.PromptService,
        llm_service_1.LLMService])
], RecommendService);
//# sourceMappingURL=recommend.service.js.map