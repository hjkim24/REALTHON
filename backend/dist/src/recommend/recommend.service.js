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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendService = void 0;
const common_1 = require("@nestjs/common");
const src_1 = require("../../libs/exception/src");
const llm_service_1 = require("./llm/llm.service");
const prompt_service_1 = require("./rag/prompt.service");
const vector_service_1 = require("./rag/vector.service");
let RecommendService = class RecommendService {
    constructor(vector, prompt, llm) {
        this.vector = vector;
        this.prompt = prompt;
        this.llm = llm;
    }
    async recommend(info) {
        const firstDocs = await this.vector.initialSearch(info.course);
        const refinePrompt = this.prompt.buildRefineQueryPrompt(firstDocs, info.grade);
        const refinedQuery = await this.llm.ask(refinePrompt);
        if (!refinedQuery) {
            throw new src_1.EntityNotExistException('refinedQuery');
        }
        const finalDocs = await this.vector.finalSearch(refinedQuery, info.target_type);
        const finalPrompt = this.prompt.buildFinalPrompt(finalDocs, info);
        const result = await this.llm.ask(finalPrompt);
        return {
            refinedQuery,
            recommendation: result,
        };
    }
};
exports.RecommendService = RecommendService;
exports.RecommendService = RecommendService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vector_service_1.VectorService,
        prompt_service_1.PromptService,
        llm_service_1.LLMService])
], RecommendService);
//# sourceMappingURL=recommend.service.js.map