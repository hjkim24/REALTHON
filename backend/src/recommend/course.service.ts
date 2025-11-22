import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Grade } from '@prisma/client';
import { MulterFile } from '../common/types/multer.types';
import { OpenAIService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    private readonly openaiService: OpenAIService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Grade 문자열을 Prisma Grade enum으로 변환
   * @param grade "A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "P"
   * @returns Grade enum 값
   */
  convertGradeToEnum(grade: string): Grade {
    const gradeMap: Record<string, Grade> = {
      'A+': Grade.A_PLUS,
      A: Grade.A,
      'B+': Grade.B_PLUS,
      B: Grade.B,
      'C+': Grade.C_PLUS,
      C: Grade.C,
      'D+': Grade.D_PLUS,
      D: Grade.D,
      F: Grade.F,
      P: Grade.P,
    } as const;

    const normalizedGrade = grade.trim().toUpperCase();

    // 타입 가드로 명확하게 처리
    if (!(normalizedGrade in gradeMap)) {
      throw new BadRequestException(
        `유효하지 않은 성적입니다: ${grade}. 허용된 값: A+, A, B+, B, C+, C, D+, D, F, P`,
      );
    }

    return gradeMap[normalizedGrade]; // non-null assertion 사용
  }

  /**
   * 학수번호에서 부서 코드 추출
   * @param courseCode 학수번호 (예: "CS101", "MATH201")
   * @returns 부서 코드 (예: "CS", "MATH")
   */
  extractDepartmentFromCode(courseCode: string): string {
    // 학수번호에서 영문자 부분 추출 (예: "CS101" → "CS")
    const match = courseCode.match(/^([A-Z]+)/i);
    if (!match || !match[1]) {
      throw new BadRequestException(
        `학수번호 형식이 올바르지 않습니다: ${courseCode}`,
      );
    }
    return match[1].toUpperCase();
  }

  /**
   * Department 조회 또는 생성
   * @param code 부서 코드 (예: "CS")
   * @returns Department ID
   */
  async getOrCreateDepartment(code: string): Promise<number> {
    let department = await this.prisma.department.findUnique({
      where: { code },
    });

    if (!department) {
      // Department가 없으면 생성 (한글명은 코드와 동일하게 설정)
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

  /**
   * 성적표 이미지 업로드 및 Course 생성
   * @param file 업로드된 이미지 파일
   * @returns 생성된 Course 정보 배열
   */
  async uploadTranscript(file: MulterFile) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 타입 가드: 필수 속성 확인
    if (!file.mimetype || !file.originalname || !file.buffer || !file.size) {
      throw new BadRequestException('파일 정보가 올바르지 않습니다.');
    }

    // 이미지 파일만 허용
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('이미지 파일만 업로드 가능합니다.');
    }

    // OpenAI API를 사용하여 성적표 정보 추출
    this.logger.log('OpenAI API를 사용하여 성적표 정보 추출 중...');
    const extractedCourses = await this.openaiService.extractTranscriptInfo(
      file.buffer,
      file.mimetype,
    );

    if (extractedCourses.length === 0) {
      throw new BadRequestException(
        '성적표에서 과목 정보를 추출할 수 없습니다.',
      );
    }

    // Course 생성
    const createdCourses: Array<{
      id: number;
      title: string;
      courseCode: string;
      grade: Grade;
    }> = [];
    for (const extracted of extractedCourses) {
      try {
        // Grade 변환
        const gradeEnum = this.convertGradeToEnum(extracted.grade);

        // Department 코드 추출
        const deptCode = this.extractDepartmentFromCode(extracted.courseCode);

        // Department 조회 또는 생성
        const departmentId = await this.getOrCreateDepartment(deptCode);

        // Course 생성 또는 업데이트 (upsert 사용)
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
          },
          create: {
            departmentId,
            courseCode: extracted.courseCode,
            title: extracted.title,
            grade: gradeEnum,
          },
        });

        createdCourses.push(course);
      } catch (error) {
        this.logger.error(
          `과목 생성 실패: ${extracted.title} (${extracted.courseCode})`,
          error,
        );
        // 개별 과목 생성 실패해도 계속 진행
      }
    }

    this.logger.log(
      `${createdCourses.length}개의 과목이 생성/업데이트되었습니다.`,
    );

    return {
      courses: createdCourses,
    };
  }
}
