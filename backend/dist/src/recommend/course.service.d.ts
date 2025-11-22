import { Category, Grade } from '@prisma/client';
import { MulterFile } from '../common/types/multer.types';
import { OpenAIService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class CourseService {
    private readonly openaiService;
    private readonly prisma;
    private readonly logger;
    constructor(openaiService: OpenAIService, prisma: PrismaService);
    convertCategoryToEnum(category: string): Category;
    convertGradeToEnum(grade: string): Grade;
    extractDepartmentFromCode(courseCode: string): string;
    getOrCreateDepartment(code: string): Promise<number>;
    uploadTranscript(file: MulterFile): Promise<{
        courses: {
            id: number;
            title: string;
            courseCode: string;
            grade: Grade;
            category: Category;
        }[];
    }>;
}
