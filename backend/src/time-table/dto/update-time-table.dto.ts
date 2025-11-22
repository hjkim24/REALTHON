import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeTableDto } from './create-time-table.dto';

export class UpdateTimeTableDto extends PartialType(CreateTimeTableDto) {}
