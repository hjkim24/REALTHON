import { MulterFile } from '../common/types/multer.types';
import { CourseService } from './course.service';
import { RecommendDto } from './dto/recommend.dto';
import { RecommendService } from './recommend.service';
export declare class RecommendController {
    private service;
    private courseService;
    constructor(service: RecommendService, courseService: CourseService);
    getRecommendation(dto: RecommendDto): Promise<{
        recommendations: Array<{
            courseId: string;
            title: string;
            reason: string;
            similarity: number;
            metadata?: Record<string, any>;
        }>;
    }>;
    uploadTranscript(file: MulterFile | undefined): Promise<{
        recommendations: Array<{
            courseId: string;
            title: string;
            reason: string;
            similarity: number;
            metadata?: Record<string, any>;
        }>;
    }>;
}
