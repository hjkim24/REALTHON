import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import type { Document } from '@langchain/core/documents';
import { Injectable } from '@nestjs/common';

@Injectable()
export class VectorService {
  private vectordb: Chroma;
  private embedding: HuggingFaceInferenceEmbeddings;

  constructor() {
    this.embedding = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HF_API_KEY,
      model: 'sentence-transformers/all-mpnet-base-v2',
    });

    this.vectordb = new Chroma(this.embedding, {
      collectionName: 'course_embeddings',
    });
  }

  async initialSearch(
    course: string,
  ): Promise<Array<Document<Record<string, any>>>> {
    const query = `${course} 강의계획서 강의평 특징`;
    const queryEmbedding = await this.embedding.embedQuery(query);
    const results = await this.vectordb.similaritySearchVectorWithScore(
      queryEmbedding,
      3,
    );
    return results.map(([document]) => document);
  }

  async finalSearch(
    query: string,
    targetType: string,
  ): Promise<Array<Document<Record<string, any>>>> {
    const queryEmbedding = await this.embedding.embedQuery(query);
    const results = await this.vectordb.similaritySearchVectorWithScore(
      queryEmbedding,
      10,
      {
        type: targetType,
      } as Record<string, unknown>,
    );
    return results.map(([document]) => document);
  }
}
