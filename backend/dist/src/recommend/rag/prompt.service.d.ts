import { Document } from '@langchain/core/documents';
import { Category, Grade } from '@prisma/client';
import { RecommendDto } from '../dto/recommend.dto';
export declare class PromptService {
    buildRefineQueryPrompt(firstDocs: Array<Document<Record<string, any>>>, grade: string, userCourses?: Array<{
        id: number;
        title: string;
        courseCode: string;
        grade: Grade;
        category: Category;
    }>, targetCategory?: Category): string;
    buildFinalPrompt(finalDocs: Array<Document<Record<string, any>>>, info: RecommendDto, userCourses?: Array<{
        id: number;
        title: string;
        courseCode: string;
        grade: Grade;
        category: Category;
    }>): string;
}
