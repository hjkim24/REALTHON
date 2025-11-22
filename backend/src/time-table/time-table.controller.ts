import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../common/types/multer.types';
import { TimeTableService } from './time-table.service';

@Controller('time-table')
export class TimeTableController {
  constructor(private readonly timeTableService: TimeTableService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadTimeTableImage(
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<{
    lectures: Array<{
      name: string;
      room: string;
      startTime?: string;
      endTime?: string;
      lectureDays: Array<{
        day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
      }>;
    }>;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    return await this.timeTableService.uploadTimeTableImage(file);
  }
}
