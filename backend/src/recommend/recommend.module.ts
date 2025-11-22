import { Module } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CourseService } from './course.service';
import { LLMService } from './llm/llm.service';
import { PromptService } from './rag/prompt.service';
import { VectorService } from './rag/vector.service';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';

@Module({
  controllers: [RecommendController],
  providers: [
    RecommendService,
    VectorService,
    PromptService,
    LLMService,
    CourseService,
    OpenAIService,
    PrismaService,
  ],
})
export class RecommendModule {}
