import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class LLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async ask(prompt: string) {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: '당신은 강의 추천 AI입니다.' },
        { role: 'user', content: prompt },
      ],
    });

    return res.choices[0].message['content'];
  }
}
