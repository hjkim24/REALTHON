import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MulterFile } from '../common/types/multer.types';
import { OpenAIService } from '../openai/openai.service';

export interface LectureResponse {
  name: string;
  room: string;
  startTime?: string;
  endTime?: string;
  lectureDays: Array<{
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  }>;
}

@Injectable()
export class TimeTableService {
  private readonly logger = new Logger(TimeTableService.name);

  constructor(private openaiService: OpenAIService) {}

  async uploadTimeTableImage(
    file: MulterFile,
  ): Promise<{ lectures: LectureResponse[] }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 타입 가드: 필수 속성 확인
    if (!file.mimetype || !file.originalname || !file.buffer || !file.size) {
      throw new BadRequestException('파일 정보가 올바르지 않습니다.');
    }

    // 이미지 파일만 허용
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    }

    // OpenAI API를 사용하여 시간표 정보 추출
    this.logger.log('OpenAI API를 사용하여 시간표 정보 추출 중...');
    const extractedLectures = await this.openaiService.extractTimeTableInfo(
      file.buffer,
      file.mimetype,
    );

    // Lecture 형식에 맞게 변환
    const lectures: LectureResponse[] = extractedLectures.map((lecture) => {
      // dayOfWeek를 lectureDays 배열로 변환
      // dayOfWeek가 배열이면 여러 요일, 문자열이면 단일 요일
      const dayOfWeekArray = Array.isArray(lecture.dayOfWeek)
        ? lecture.dayOfWeek
        : lecture.dayOfWeek
          ? [lecture.dayOfWeek]
          : [];

      const lectureDays = dayOfWeekArray.map((day) => ({
        day: this.convertDayOfWeekToEnum(day),
      }));

      return {
        name: lecture.name,
        room: lecture.room,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        lectureDays,
      };
    });

    this.logger.log(`${lectures.length}개의 강의 정보가 추출되었습니다.`);

    return { lectures };
  }

  private convertDayOfWeekToEnum(
    dayOfWeek: string,
  ): 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' {
    const dayMap: Record<
      string,
      'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'
    > = {
      월: 'MONDAY',
      화: 'TUESDAY',
      수: 'WEDNESDAY',
      목: 'THURSDAY',
      금: 'FRIDAY',
      Monday: 'MONDAY',
      Tuesday: 'TUESDAY',
      Wednesday: 'WEDNESDAY',
      Thursday: 'THURSDAY',
      Friday: 'FRIDAY',
      MONDAY: 'MONDAY',
      TUESDAY: 'TUESDAY',
      WEDNESDAY: 'WEDNESDAY',
      THURSDAY: 'THURSDAY',
      FRIDAY: 'FRIDAY',
    };

    return dayMap[dayOfWeek] || 'MONDAY';
  }
}
