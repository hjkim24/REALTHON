export enum AnalysisType {
  GENERAL = 'GENERAL',
  MAJOR = 'MAJOR'
}

export interface CourseRecommendation {
  courseName: string;
  courseCode: string;
  credits: number;
  rating: number; // 1 to 5
  reason: string;
}

export interface AnalysisResult {
  type: AnalysisType;
  recommendations: CourseRecommendation[];
}

export interface HistoryItem {
  id: number;
  title: string;
  date: string;
  type: AnalysisType;
  recommendations: CourseRecommendation[];
}