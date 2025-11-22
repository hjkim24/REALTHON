import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ExtractedLecture {
  name: string;
  room: string;
  dayOfWeek?: string | string[]; // 단일 요일 또는 여러 요일 배열
  startTime?: string;
  endTime?: string;
}

interface OpenAILectureResponse {
  name?: string;
  room?: string;
  dayOfWeek?: string | string[]; // 단일 요일 또는 여러 요일 배열
  startTime?: string;
  endTime?: string;
}

interface OpenAIResponse {
  lectures?: OpenAILectureResponse[];
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY가 설정되지 않았습니다. OpenAI 기능을 사용할 수 없습니다.',
      );
    }
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async extractTimeTableInfo(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedLecture[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }

    try {
      // 이미지를 base64로 변환
      const base64Image = imageBuffer.toString('base64');

      // OpenAI Vision API 호출
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 시간표 이미지를 분석해서 다음 정보를 JSON 형식으로 추출해주세요:
- 과목명 (name): 강의 과목 이름
- 강의실 (room): 강의실 번호 또는 위치
- 요일 (dayOfWeek): 월, 화, 수, 목, 금 중 하나 또는 여러 개 (한글로 반환)
- 시작 시간 (startTime): HH:MM 형식 (예: "09:00")
- 종료 시간 (endTime): HH:MM 형식 (예: "10:30")

중요 사항:
- 하나의 강의가 여러 요일에 걸쳐 있으면, 하나의 강의 객체에 dayOfWeek를 배열로 포함해주세요.
- 예를 들어 "데이터베이스" 강의가 월요일과 수요일에 있으면, 하나의 강의 객체에 dayOfWeek를 ["월", "수"]로 포함해주세요.
- 같은 과목명, 같은 강의실, 같은 시간대인 경우 하나의 강의로 묶어주세요.

응답은 반드시 다음 형식의 JSON 객체로 반환해주세요 (lectures 키에 배열 포함):
{
  "lectures": [
    {
      "name": "과목명",
      "room": "강의실",
      "dayOfWeek": "월",
      "startTime": "09:00",
      "endTime": "10:30"
    },
    {
      "name": "과목명",
      "room": "강의실",
      "dayOfWeek": ["월", "수"],
      "startTime": "09:00",
      "endTime": "10:30"
    }
  ]
}

dayOfWeek는 단일 요일이면 문자열로, 여러 요일이면 문자열 배열로 반환해주세요.
시간표에 있는 모든 강의를 정확하게 추출해주세요.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API 응답이 비어있습니다.');
      }

      // JSON 파싱
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('JSON 파싱 실패');
      }

      // 타입 가드: OpenAI 응답 형식 확인
      const isOpenAIResponse = (
        obj: unknown,
      ): obj is OpenAIResponse & { lectures?: unknown[] } => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          ('lectures' in obj || Array.isArray(obj))
        );
      };

      if (!isOpenAIResponse(parsed)) {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }

      // lectures 배열 추출
      let lectures: OpenAILectureResponse[] = [];
      if (Array.isArray(parsed.lectures)) {
        lectures = parsed.lectures;
      } else if (Array.isArray(parsed)) {
        lectures = parsed;
      } else {
        throw new Error('응답에 lectures 배열이 없습니다.');
      }

      // 타입 가드: 강의 객체 형식 확인
      const isValidLecture = (obj: unknown): obj is OpenAILectureResponse => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          ('name' in obj || 'room' in obj)
        );
      };

      return lectures
        .filter(isValidLecture)
        .map((lecture): ExtractedLecture => {
          // dayOfWeek 처리: 문자열 또는 문자열 배열
          let dayOfWeek: string | string[] | undefined;
          if (Array.isArray(lecture.dayOfWeek)) {
            dayOfWeek = lecture.dayOfWeek.filter(
              (day): day is string => typeof day === 'string',
            );
          } else if (typeof lecture.dayOfWeek === 'string') {
            dayOfWeek = lecture.dayOfWeek;
          }

          return {
            name: typeof lecture.name === 'string' ? lecture.name : '',
            room: typeof lecture.room === 'string' ? lecture.room : '',
            dayOfWeek,
            startTime:
              typeof lecture.startTime === 'string'
                ? lecture.startTime
                : undefined,
            endTime:
              typeof lecture.endTime === 'string' ? lecture.endTime : undefined,
          };
        });
    } catch (error) {
      this.logger.error('OpenAI API 호출 실패:', error);
      throw new Error(
        `시간표 정보 추출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }
}
