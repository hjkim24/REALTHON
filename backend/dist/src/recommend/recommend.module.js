"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendModule = void 0;
const common_1 = require("@nestjs/common");
const openai_service_1 = require("../openai/openai.service");
const prisma_service_1 = require("../prisma/prisma.service");
const course_service_1 = require("./course.service");
const llm_service_1 = require("./llm/llm.service");
const prompt_service_1 = require("./rag/prompt.service");
const vector_service_1 = require("./rag/vector.service");
const recommend_controller_1 = require("./recommend.controller");
const recommend_service_1 = require("./recommend.service");
let RecommendModule = class RecommendModule {
};
exports.RecommendModule = RecommendModule;
exports.RecommendModule = RecommendModule = __decorate([
    (0, common_1.Module)({
        controllers: [recommend_controller_1.RecommendController],
        providers: [
            recommend_service_1.RecommendService,
            vector_service_1.VectorService,
            prompt_service_1.PromptService,
            llm_service_1.LLMService,
            course_service_1.CourseService,
            openai_service_1.OpenAIService,
            prisma_service_1.PrismaService,
        ],
    })
], RecommendModule);
//# sourceMappingURL=recommend.module.js.map