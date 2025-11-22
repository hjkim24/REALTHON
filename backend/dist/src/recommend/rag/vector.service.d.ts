import type { Document } from '@langchain/core/documents';
export declare class VectorService {
    private vectordb;
    private embedding;
    constructor();
    initialSearch(course: string): Promise<Array<Document<Record<string, any>>>>;
    finalSearch(query: string, targetType: string): Promise<Array<Document<Record<string, any>>>>;
}
