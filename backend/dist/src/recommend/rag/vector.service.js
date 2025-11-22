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
exports.VectorService = void 0;
const hf_1 = require("@langchain/community/embeddings/hf");
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const common_1 = require("@nestjs/common");
let VectorService = class VectorService {
    constructor() {
        this.embedding = new hf_1.HuggingFaceInferenceEmbeddings({
            apiKey: process.env.HF_API_KEY,
            model: 'sentence-transformers/all-mpnet-base-v2',
        });
        this.vectordb = new chroma_1.Chroma(this.embedding, {
            collectionName: 'course_embeddings',
        });
    }
    async initialSearch(course) {
        const query = `${course} 강의계획서 강의평 특징`;
        const queryEmbedding = await this.embedding.embedQuery(query);
        const results = await this.vectordb.similaritySearchVectorWithScore(queryEmbedding, 3);
        return results.map(([document]) => document);
    }
    async finalSearch(query, targetType) {
        const queryEmbedding = await this.embedding.embedQuery(query);
        const results = await this.vectordb.similaritySearchVectorWithScore(queryEmbedding, 10, {
            type: targetType,
        });
        return results.map(([document]) => document);
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VectorService);
//# sourceMappingURL=vector.service.js.map