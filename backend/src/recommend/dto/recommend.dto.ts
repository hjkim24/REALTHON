import { IsString } from 'class-validator';

export class RecommendDto {
  @IsString()
  course?: string;

  @IsString()
  grade?: string;

  @IsString()
  target_type: string; // 전공 or 교양
}
