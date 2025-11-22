import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ExtractedLecture {
  name: string;
  room: string;
  lectureDays?: string[]; // 요일 배열 (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)
  startTime?: string;
  endTime?: string;
}

export interface ExtractedCourse {
  title: string;
  courseCode: string;
  grade: string; // "A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "P"
  category: string; // "General" or "Major"
}

interface OpenAILectureResponse {
  name?: string;
  room?: string;
  lectureDays?: string[]; // 요일 배열 (MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY)
  startTime?: string;
  endTime?: string;
}

interface OpenAIResponse {
  lectures?: OpenAILectureResponse[];
}

interface OpenAICourseResponse {
  title?: string;
  courseCode?: string;
  grade?: string;
  category?: string;
}

interface OpenAITranscriptResponse {
  courses?: OpenAICourseResponse[];
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
- 요일 (lectureDays): MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY 중 하나 또는 여러 개
- 시작 시간 (startTime): HH:MM 형식 (예: "09:00")
- 종료 시간 (endTime): HH:MM 형식 (예: "10:30")

중요 사항:
- 수업에 대한 시간표는 다음과 같아: 1교시 : 09:00 ~ 10:15, 2교시 : 10:30 ~ 11:45, 3교시 : 12:00 ~ 13:15, 4교시 : 13:30 ~ 14:45, 5교시 : 15:00 ~ 16:15, 암튼 이렇게 있음.
- 분석한 강의 시간대가 위의 시간표와 맞지 않을 시 위에 있는 시간을 기준으로 알려줘.
- 하나의 강의가 여러 요일에 걸쳐 있으면, 하나의 강의 객체에 lectureDays 배열에 모든 요일을 포함해주세요.
- 예를 들어 "데이터베이스" 강의가 월요일과 수요일에 있으면, lectureDays에 ["MONDAY", "WEDNESDAY"]를 포함해주세요.
- 같은 과목명, 같은 강의실, 같은 시간대인 경우 하나의 강의로 묶어주세요.
- 요일은 반드시 영어 대문자로 반환해주세요: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY

응답은 반드시 다음 형식의 JSON 객체로 반환해주세요 (lectures 키에 배열 포함):
{
  "lectures": [
    {
      "name": "과목명",
      "room": "강의실",
      "lectureDays": ["MONDAY"],
      "startTime": "09:00",
      "endTime": "10:30"
    },
    {
      "name": "과목명",
      "room": "강의실",
      "lectureDays": ["MONDAY", "WEDNESDAY"],
      "startTime": "09:00",
      "endTime": "10:30"
    }
  ]
}

lectureDays는 항상 문자열 배열로 반환해주세요 (단일 요일이어도 배열로).
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
          // lectureDays 처리: 문자열 배열
          let lectureDays: string[] | undefined;
          if (Array.isArray(lecture.lectureDays)) {
            lectureDays = lecture.lectureDays.filter(
              (day): day is string => typeof day === 'string',
            );
          }

          return {
            name: typeof lecture.name === 'string' ? lecture.name : '',
            room: typeof lecture.room === 'string' ? lecture.room : '',
            lectureDays,
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

  async extractTranscriptInfo(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ExtractedCourse[]> {
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
                text: `이 성적표 이미지를 분석해서 다음 정보를 JSON 형식으로 추출해주세요:
- 과목명 (title): 강의 과목 이름
- 학수번호 (courseCode): 학수번호 (예: "CS101", "MATH201")
- 성적 (grade): 성적 (A+, A, B+, B, C+, C, D+, D, F, P 중 하나)
- 전공/교양 여부 (category): 교양이라고 써있으면 General, 나머지는 모두 Major

중요 사항:
- 성적은 반드시 다음 형식 중 하나로 반환해주세요: A+, A, B+, B, C+, C, D+, D, F, P
- 학수번호는 숫자와 영문자로 구성된 코드입니다 (예: "CS101", "MATH201", "ENG101")
- 성적표에 있는 모든 과목을 정확하게 추출해주세요.

응답은 반드시 다음 형식의 JSON 객체로 반환해주세요 (courses 키에 배열 포함):
{
  "courses": [
    {
      "title": "과목명",
      "courseCode": "CS101",
      "grade": "A+",
      "category": "General"
    },
    {
      "title": "과목명",
      "courseCode": "MATH201",
      "grade": "B",
      "category": "Major"
    }
  ]
}

성적표에 있는 모든 과목을 정확하게 추출해주세요.`,
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
      const isTranscriptResponse = (
        obj: unknown,
      ): obj is OpenAITranscriptResponse & { courses?: unknown[] } => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          ('courses' in obj || Array.isArray(obj))
        );
      };

      if (!isTranscriptResponse(parsed)) {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }

      // courses 배열 추출
      let courses: OpenAICourseResponse[] = [];
      if (Array.isArray(parsed.courses)) {
        courses = parsed.courses;
      } else if (Array.isArray(parsed)) {
        courses = parsed;
      } else {
        throw new Error('응답에 courses 배열이 없습니다.');
      }

      // 타입 가드: 과목 객체 형식 확인
      const isValidCourse = (obj: unknown): obj is OpenAICourseResponse => {
        return (
          typeof obj === 'object' &&
          obj !== null &&
          ('title' in obj || 'courseCode' in obj || 'grade' in obj)
        );
      };

      return courses.filter(isValidCourse).map((course): ExtractedCourse => {
        // category가 없거나 유효하지 않으면 기본값으로 "Major" 사용
        let category = 'Major';
        if (typeof course.category === 'string') {
          const normalizedCategory = course.category.trim();
          if (
            normalizedCategory === 'General' ||
            normalizedCategory === '교양'
          ) {
            category = 'General';
          }
        }

        return {
          title: typeof course.title === 'string' ? course.title : '',
          courseCode:
            typeof course.courseCode === 'string' ? course.courseCode : '',
          grade: typeof course.grade === 'string' ? course.grade : '',
          category,
        };
      });
    } catch (error) {
      this.logger.error('OpenAI API 호출 실패:', error);
      throw new Error(
        `성적표 정보 추출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }
}
