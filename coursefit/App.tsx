// App.tsx
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import UploadSection from "./components/UploadSection";
import ResultsSection from "./components/ResultsSection";
import { AnalysisType, CourseRecommendation, HistoryItem } from "./types";
import { postImage } from "./api/uploadImage"; // Gemini 분석 대신 REST API
import { Loader2, Sparkles } from "lucide-react";

const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [recommendations, setRecommendations] = useState<
    CourseRecommendation[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [userMajor, setUserMajor] = useState("");

  // History 데이터/핸들러는 기존대로
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: 1,
      title: "1학년 1학기 성적",
      date: "2024.02.20",
      type: AnalysisType.GENERAL,
      recommendations: [
        {
          courseName: "현대 미술의 이해",
          courseCode: "ART101",
          credits: 3,
          rating: 5,
          reason:
            "예술적 감각이 뛰어난 A+ 성적을 바탕으로, 창의성을 발휘할 수 있는 이 과목을 추천합니다.",
        },
        {
          courseName: "심리학 개론",
          courseCode: "PSY101",
          credits: 3,
          rating: 4,
          reason:
            "인문학적 소양이 깊어 심리 분석 및 에세이 작성에 강점을 보일 것입니다.",
        },
        {
          courseName: "글로벌 매너와 에티켓",
          courseCode: "GEN205",
          credits: 2,
          rating: 5,
          reason:
            "성실한 학습 태도를 바탕으로 부담 없이 학점을 챙길 수 있는 꿀과목입니다.",
        },
      ],
    },
    {
      id: 2,
      title: "전공 필수 분석",
      date: "2024.02.15",
      type: AnalysisType.MAJOR,
      recommendations: [
        {
          courseName: "고급 알고리즘",
          courseCode: "CS301",
          credits: 3,
          rating: 3,
          reason:
            "수학적 사고력이 뛰어나므로 복잡한 알고리즘 문제 해결에 흥미를 느낄 것입니다.",
        },
        {
          courseName: "인공지능 기초",
          courseCode: "AI202",
          credits: 3,
          rating: 4,
          reason:
            "논리적 추론 능력이 우수하여 AI 모델링의 기초 개념을 쉽게 습득할 수 있습니다.",
        },
        {
          courseName: "데이터베이스 설계",
          courseCode: "DB201",
          credits: 3,
          rating: 5,
          reason:
            "구조적인 사고가 강점인 학생에게 체계적인 DB 설계 수업이 적합합니다.",
        },
      ],
    },
  ]);

  // ------ 수정된 부분: 이미지 URL 받아서 서버 분석 요청 ------
  const handleAnalyze = async (
    imageUrl: string,
    type: AnalysisType,
    major: string
  ) => {
    setIsAnalyzing(true);
    setAnalysisType(type);
    setUserMajor(major);

    try {
      // 서버에 이미지url 전달, 결과 받기 (기존 Gemini 대신)
      const response = await postImage({ imageurl: imageUrl.trim() });

      // 서버 응답 (response.subjects) → 화면용 CourseRecommendation[] 매핑
      const results: CourseRecommendation[] = response.subjects.map(
        (subject) => ({
          courseName: subject.title,
          courseCode: "", // 서버에 코드 추가시 매핑
          credits: 3, // 서버에 있으면 사용, 없으면 기본값
          rating: 4, // 서버에 있으면 사용, 없으면 기본값
          reason: subject.description,
        })
      );

      setRecommendations(results);
      setHasResults(true);

      // 분석 성공 시 히스토리로 추가
      const newItem: HistoryItem = {
        id: Date.now(),
        title: `${type === AnalysisType.GENERAL ? "교양" : "전공"} 분석 결과`,
        date: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        type,
        recommendations: results,
      };
      setHistoryItems((prev) => [newItem, ...prev]);
    } catch (err) {
      alert("분석에 실패했습니다. 다시 시도해주세요.");
      setAnalysisType(null); // Reset on error
    } finally {
      setIsAnalyzing(false);
    }
  };
  // -----------------------------------------------------------

  const handleReset = () => {
    setHasResults(false);
    setRecommendations([]);
    setAnalysisType(null);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setRecommendations(item.recommendations);
    setAnalysisType(item.type);
    setHasResults(true);
    setIsAnalyzing(false);
  };

  const handleRenameHistoryItem = (id: number, newTitle: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#F5F9FF] font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        historyItems={historyItems}
        onNewAnalysis={handleReset}
        onHistorySelect={handleHistorySelect}
        onRenameHistoryItem={handleRenameHistoryItem}
      />

      {/* Main Content */}
      <main className="flex-1 h-full relative flex flex-col overflow-y-auto">
        {/* Background Decor */}
        <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="fixed top-[20%] left-[15%] w-[400px] h-[400px] bg-yellow-100/40 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Content Container */}
        <div className="flex-1 relative z-10 p-8 md:p-12 flex flex-col items-center min-h-min max-w-7xl mx-auto w-full">
          {isAnalyzing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in my-auto">
              <div className="relative w-28 h-28 mb-8">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse-slow"></div>
                <div className="relative bg-white w-full h-full rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-white flex items-center justify-center">
                  <Loader2
                    className="w-12 h-12 text-black animate-spin"
                    strokeWidth={2}
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-black text-white p-2 rounded-full shadow-lg animate-bounce">
                  <Sparkles
                    size={20}
                    fill="currentColor"
                    className="text-yellow-400"
                  />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
                분석 중입니다...
              </h3>
              <p className="text-slate-500 font-medium text-lg">
                {userMajor
                  ? `${userMajor} 전공자에게 딱 맞는`
                  : "나에게 딱 맞는"}{" "}
                <br />
                꿀과목을 찾고 있어요 🍯
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col flex-grow justify-center">
              {!hasResults ? (
                <div className="flex-grow flex items-center justify-center py-10">
                  {/* 파일 대신 업로드 섹션에서 이미지URL/전공 등 전달 */}
                  <UploadSection
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                  />
                </div>
              ) : (
                <ResultsSection
                  recommendations={recommendations}
                  type={analysisType || AnalysisType.GENERAL}
                  onReset={handleReset}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
