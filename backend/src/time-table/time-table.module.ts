import { Module } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { TimeTableController } from './time-table.controller';
import { TimeTableService } from './time-table.service';

@Module({
  controllers: [TimeTableController],
  providers: [TimeTableService, OpenAIService],
})
export class TimeTableModule {}
