import { Category, Grade } from '@prisma/client';
import { MulterFile } from '../common/types/multer.types';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { RecommendService } from './recommend.service';
export declare class RecommendController {
    private service;
    private courseService;
    constructor(service: RecommendService, courseService: CourseService);
    getRecommendation(dto: RecommendDto): Promise<{
        refinedQuery: string;
        recommendation: string | null;
    }>;
    uploadTranscript(file: MulterFile | undefined): Promise<{
        courses: Array<{
            id: number;
            title: string;
            courseCode: string;
            grade: Grade;
            category: Category;
        }>;
    }>;
}
