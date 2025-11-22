import { RecommendDto } from './dto/recommend.dto';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';
export declare class RecommendService {
    private vector;
    private prompt;
    private llm;
    constructor(vector: VectorService, prompt: PromptService, llm: LLMService);
    recommend(info: RecommendDto): Promise<{
        refinedQuery: string;
        recommendation: string | null;
    }>;
}
