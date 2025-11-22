import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';
interface RecommendedCourse {
    courseId: string;
    title: string;
    reason: string;
    similarity: number;
    metadata?: Record<string, any>;
}
export declare class RecommendService {
    private vector;
    private courseService;
    private promptService;
    private llmService;
    private readonly logger;
    constructor(vector: VectorService, courseService: CourseService, promptService: PromptService, llmService: LLMService);
    recommend(info: RecommendDto): Promise<{
        recommendations: RecommendedCourse[];
    }>;
    private getGradeWeight;
    private parseLLMResponse;
    private fallbackRecommendations;
}
export {};
