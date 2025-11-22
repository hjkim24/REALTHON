import { Document } from '@langchain/core/documents';
import { OnModuleInit } from '@nestjs/common';
export declare class VectorService implements OnModuleInit {
    private readonly logger;
    private readonly embeddings;
    private vectorStore;
    private readonly collectionName;
    private readonly chromaServerUrl;
    constructor();
    onModuleInit(): Promise<void>;
    initialSearch(course: string): Promise<Document[]>;
    finalSearch(query: string, _targetType: string): Promise<Document[]>;
}
