import React from 'react';
import { AnalysisType, CourseRecommendation } from '../types';
import { Star, ThumbsUp, ArrowLeft, PlusCircle } from 'lucide-react';

interface ResultsSectionProps {
  recommendations: CourseRecommendation[];
  type: AnalysisType;
  onReset: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ recommendations, type, onReset }) => {
  
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col animate-slide-up pb-12">
      
      {/* Navigation Header */}
      <div className="mb-6 flex-shrink-0">
        <button 
            onClick={onReset}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
            <div className="p-2 rounded-full bg-white border border-slate-200 group-hover:border-black group-hover:shadow-md transition-all">
                <ArrowLeft size={18} />
            </div>
            <span className="font-bold text-sm">다시 선택하기</span>
        </button>

        <div className="flex items-end justify-between border-b-2 border-slate-100 pb-6">
            <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">추천 과목 결과</h2>
            <p className="text-slate-500 mt-2 font-medium">
                분석된 <span className="text-blue-600 font-extrabold">{recommendations.length}개</span>의 과목으로 A+를 노려보세요.
            </p>
            </div>
            <div className={`px-5 py-2 rounded-2xl font-bold text-sm flex items-center gap-2 border-2
                ${type === AnalysisType.GENERAL 
                    ? 'bg-purple-50 text-purple-700 border-purple-100' 
                    : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
            {type === AnalysisType.GENERAL ? '🎨 교양' : '🎓 전공'} 분석 완료
            </div>
        </div>
      </div>

      {/* Content Area (Natural Height) */}
      <div className="space-y-4">
        {/* Cards Grid */}
        {recommendations.map((course, index) => (
          <div 
            key={index} 
            className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              
              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">Course</span>
                  <h3 className="text-xl font-extrabold text-slate-900 truncate">
                    {course.courseName}
                  </h3>
                </div>
                
                <div className="flex gap-3 text-xs font-bold text-slate-500 mb-4">
                  <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">학점: {course.credits}</span>
                  <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">코드: {course.courseCode}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">난이도 평가</span>
                    <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                        <Star 
                            key={i} 
                            size={14} 
                            className={`${i < Math.floor(course.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 fill-slate-200'}`} 
                            />
                        ))}
                    </div>
                </div>
              </div>

              {/* Reason Card */}
              <div className="flex-[1.5] relative">
                 <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 min-w-[20px] text-blue-600">
                            <ThumbsUp size={18} fill="currentColor" className="bg-white rounded-full" />
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            {course.reason}
                        </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ))}

        {/* New Analysis Button Area (At bottom of list) */}
        <div className="pt-8 pb-4">
            <div className="border-t-2 border-dashed border-slate-200 mb-8"></div>
            <div className="flex justify-center">
                <button
                onClick={onReset}
                className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 w-full md:w-auto justify-center"
                >
                <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                새로운 분석 시작하기
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;