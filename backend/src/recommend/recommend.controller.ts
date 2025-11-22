import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Category, Grade } from '@prisma/client';
import { MulterFile } from '../common/types/multer.types';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { RecommendService } from './recommend.service';

@Controller('recommend')
export class RecommendController {
  constructor(
    private service: RecommendService,
    private courseService: CourseService,
  ) {}

  @Post()
  async getRecommendation(@Body() dto: RecommendDto) {
    return await this.service.recommend(dto);
  }

  @Post('course/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadTranscript(
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<{
    courses: Array<{
      id: number;
      title: string;
      courseCode: string;
      grade: Grade;
      category: Category;
    }>;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    return await this.courseService.uploadTranscript(file);
  }
}
