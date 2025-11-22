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
var VectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorService = void 0;
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const openai_1 = require("@langchain/openai");
const common_1 = require("@nestjs/common");
let VectorService = VectorService_1 = class VectorService {
    constructor() {
        this.logger = new common_1.Logger(VectorService_1.name);
        this.vectorStore = null;
        this.collectionName = 'courses';
        this.embeddings = new openai_1.OpenAIEmbeddings({
            modelName: 'text-embedding-ada-002',
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        this.chromaServerUrl =
            process.env.CHROMA_SERVER_URL || 'http://localhost:8000';
        this.logger.log(`ChromaDB server URL: ${this.chromaServerUrl}`);
    }
    async onModuleInit() {
        this.logger.log('Initializing VectorService...');
        try {
            this.logger.log('Initializing vector store...');
            this.logger.log(`Connecting to ChromaDB server at: ${this.chromaServerUrl}`);
            this.vectorStore = new chroma_1.Chroma(this.embeddings, {
                collectionName: this.collectionName,
                url: this.chromaServerUrl,
            });
            this.logger.log('Testing vector store connection...');
            const testResults = await this.vectorStore.similaritySearch('test', 1);
            this.logger.log(`Vector store initialized successfully. Found ${testResults.length} test result(s)`);
        }
        catch (error) {
            this.logger.error('Failed to initialize vector store', error);
            this.logger.warn('Vector store may not be properly configured');
            this.logger.warn(`Make sure ChromaDB server is running at ${this.chromaServerUrl}`);
        }
    }
    async initialSearch(course) {
        try {
            if (!this.vectorStore) {
                this.logger.error('Vector store is not initialized');
                return [];
            }
            const query = `${course} 강의계획서 강의평 특징`;
            this.logger.debug(`Initial search query: ${query}`);
            const results = await this.vectorStore.similaritySearch(query, 3);
            this.logger.log(`Initial search returned ${results.length} results`);
            return results;
        }
        catch (error) {
            this.logger.error('Error in initialSearch', error);
            return [];
        }
    }
    async finalSearch(query, _targetType) {
        try {
            if (!this.vectorStore) {
                this.logger.error('Vector store is not initialized');
                return [];
            }
            this.logger.debug(`Final search query: ${query}`);
            const results = await this.vectorStore.similaritySearch(query, 10);
            this.logger.log(`Final search returned ${results.length} results`);
            return results;
        }
        catch (error) {
            this.logger.error('Error in finalSearch', error);
            return [];
        }
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = VectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VectorService);
//# sourceMappingURL=vector.service.js.map