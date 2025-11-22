"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CourseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const openai_service_1 = require("../openai/openai.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CourseService = CourseService_1 = class CourseService {
    constructor(openaiService, prisma) {
        this.openaiService = openaiService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CourseService_1.name);
    }
    convertCategoryToEnum(category) {
        const normalizedCategory = category.trim();
        if (normalizedCategory === 'General' || normalizedCategory === '교양') {
            return client_1.Category.General;
        }
        return client_1.Category.Major;
    }
    convertGradeToEnum(grade) {
        const gradeMap = {
            'A+': client_1.Grade.A_PLUS,
            A: client_1.Grade.A,
            'B+': client_1.Grade.B_PLUS,
            B: client_1.Grade.B,
            'C+': client_1.Grade.C_PLUS,
            C: client_1.Grade.C,
            'D+': client_1.Grade.D_PLUS,
            D: client_1.Grade.D,
            F: client_1.Grade.F,
            P: client_1.Grade.P,
        };
        const normalizedGrade = grade.trim().toUpperCase();
        if (!(normalizedGrade in gradeMap)) {
            throw new common_1.BadRequestException(`유효하지 않은 성적입니다: ${grade}. 허용된 값: A+, A, B+, B, C+, C, D+, D, F, P`);
        }
        return gradeMap[normalizedGrade];
    }
    extractDepartmentFromCode(courseCode) {
        const match = courseCode.match(/^([A-Z]+)/i);
        if (!match || !match[1]) {
            throw new common_1.BadRequestException(`학수번호 형식이 올바르지 않습니다: ${courseCode}`);
        }
        return match[1].toUpperCase();
    }
    async getOrCreateDepartment(code) {
        let department = await this.prisma.department.findUnique({
            where: { code },
        });
        if (!department) {
            department = await this.prisma.department.create({
                data: {
                    code,
                    nameKo: code,
                    nameEn: code,
                },
            });
            this.logger.log(`새로운 Department 생성: ${code}`);
        }
        return department.id;
    }
    async uploadTranscript(file) {
        if (!file) {
            throw new common_1.BadRequestException('파일이 제공되지 않았습니다.');
        }
        if (!file.mimetype || !file.originalname || !file.buffer || !file.size) {
            throw new common_1.BadRequestException('파일 정보가 올바르지 않습니다.');
        }
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('이미지 파일만 업로드 가능합니다.');
        }
        this.logger.log('OpenAI API를 사용하여 성적표 정보 추출 중...');
        const extractedCourses = await this.openaiService.extractTranscriptInfo(file.buffer, file.mimetype);
        if (extractedCourses.length === 0) {
            throw new common_1.BadRequestException('성적표에서 과목 정보를 추출할 수 없습니다.');
        }
        const createdCourses = [];
        for (const extracted of extractedCourses) {
            try {
                const gradeEnum = this.convertGradeToEnum(extracted.grade);
                const categoryEnum = this.convertCategoryToEnum(extracted.category);
                const deptCode = this.extractDepartmentFromCode(extracted.courseCode);
                const departmentId = await this.getOrCreateDepartment(deptCode);
                const course = await this.prisma.course.upsert({
                    where: {
                        departmentId_courseCode: {
                            departmentId,
                            courseCode: extracted.courseCode,
                        },
                    },
                    update: {
                        title: extracted.title,
                        grade: gradeEnum,
                        category: categoryEnum,
                    },
                    create: {
                        departmentId,
                        courseCode: extracted.courseCode,
                        title: extracted.title,
                        grade: gradeEnum,
                        category: categoryEnum,
                    },
                });
                createdCourses.push(course);
            }
            catch (error) {
                this.logger.error(`과목 생성 실패: ${extracted.title} (${extracted.courseCode})`, error);
            }
        }
        this.logger.log(`${createdCourses.length}개의 과목이 생성/업데이트되었습니다.`);
        return {
            courses: createdCourses,
        };
    }
    async getUserCourses() {
        return await this.prisma.course.findMany({
            orderBy: {
                id: 'desc',
            },
        });
    }
    async getUserCoursesByCategory(category) {
        return await this.prisma.course.findMany({
            where: {
                category,
            },
            orderBy: {
                id: 'desc',
            },
        });
    }
    async getHighGradeCourses() {
        return await this.prisma.course.findMany({
            where: {
                grade: {
                    in: [client_1.Grade.A_PLUS, client_1.Grade.A],
                },
            },
            orderBy: {
                id: 'desc',
            },
        });
    }
};
exports.CourseService = CourseService;
exports.CourseService = CourseService = CourseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [openai_service_1.OpenAIService,
        prisma_service_1.PrismaService])
], CourseService);
//# sourceMappingURL=course.service.js.map