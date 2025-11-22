import { Injectable } from '@nestjs/common';
import { EntityNotExistException } from 'libs/exception/src';
import { RecommendDto } from './dto/recommend.dto';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';

@Injectable()
export class RecommendService {
  constructor(
    private vector: VectorService,
    private prompt: PromptService,
    private llm: LLMService,
  ) {}

  async recommend(info: RecommendDto) {
    // 1) 초기 검색: 해당 과목 정보 가져오기
    const firstDocs = await this.vector.initialSearch(info.course);

    // 2) 쿼리 재작성
    const refinePrompt = this.prompt.buildRefineQueryPrompt(
      firstDocs,
      info.grade,
    );
    const refinedQuery = await this.llm.ask(refinePrompt);

    if (!refinedQuery) {
      throw new EntityNotExistException('refinedQuery');
    }

    // 3) 최종 검색
    const finalDocs = await this.vector.finalSearch(
      refinedQuery,
      info.target_type,
    );

    // 4) 최종 추천 생성
    const finalPrompt = this.prompt.buildFinalPrompt(finalDocs, info);
    const result = await this.llm.ask(finalPrompt);

    return {
      refinedQuery,
      recommendation: result,
    };
  }
}
