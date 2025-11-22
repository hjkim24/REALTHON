export interface ExtractedLecture {
    name: string;
    room: string;
    lectureDays?: string[];
    startTime?: string;
    endTime?: string;
}
export interface ExtractedCourse {
    title: string;
    courseCode: string;
    grade: string;
    category: string;
}
export declare class OpenAIService {
    private readonly logger;
    private readonly openai;
    constructor();
    extractTimeTableInfo(imageBuffer: Buffer, mimeType: string): Promise<ExtractedLecture[]>;
    extractTranscriptInfo(imageBuffer: Buffer, mimeType: string): Promise<ExtractedCourse[]>;
}
