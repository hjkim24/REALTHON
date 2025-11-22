import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  async getRecommendation(@Body() dto: RecommendDto): Promise<{
    recommendations: Array<{
      courseId: string;
      title: string;
      reason: string;
      similarity: number;
      metadata?: Record<string, any>;
    }>;
  }> {
    return await this.service.recommend(dto);
  }

  @Post('course/upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadTranscript(
    @UploadedFile() file: MulterFile | undefined,
  ): Promise<{
    recommendations: Array<{
      courseId: string;
      title: string;
      reason: string;
      similarity: number;
      metadata?: Record<string, any>;
    }>;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }
    await this.courseService.uploadTranscript(file);
    return await this.service.recommend({ target_type: '전공' });
  }
}
