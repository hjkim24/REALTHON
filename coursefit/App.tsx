import React, { useState } from "react";
import Sidebar from "./sidebar/Sidebar";
import UploadSection from "./components/UploadSection";
import ResultsSection from "./results/ResultsSection";
import { AnalysisType, CourseRecommendation, HistoryItem } from "./types";
import { postImageFile } from "./api/uploadImage";
import { Loader2, Sparkles } from "lucide-react";
import appStyles from "./styles/app.styles";

const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [recommendations, setRecommendations] = useState<
    CourseRecommendation[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [userMajor, setUserMajor] = useState("");
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

  const handleAnalyze = async (
    file: File,
    type: AnalysisType,
    major: string
  ) => {
    setIsAnalyzing(true);
    setAnalysisType(type);
    setUserMajor(major);
    try {
      // FormData 업로드
      const response = await postImageFile(file);
      // 서버 응답의 subject 구조에 따라 결과 변환 (아래 예제는 서버 응답 그대로 사용)
      const results: CourseRecommendation[] = response.subjects.map(
        (subject) => ({
          courseName: subject.title,
          courseCode: subject.courseId || "", // courseId가 있으면 사용
          credits: 3, // 필요에 따라 서버에 있으면 사용
          rating: 4, // 필요에 따라 서버에 있으면 사용
          reason: subject.reason,
        })
      );
      setRecommendations(results);
      setHasResults(true);
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
    } catch {
      alert("분석에 실패했습니다. 다시 시도해주세요.");
      setAnalysisType(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
    <div className={appStyles.container}>
      <Sidebar
        historyItems={historyItems}
        onNewAnalysis={handleReset}
        onHistorySelect={handleHistorySelect}
        onRenameHistoryItem={handleRenameHistoryItem}
      />
      <main className={appStyles.main}>
        <div className={appStyles.bgBlueBlob}></div>
        <div className={appStyles.bgPurpleBlob}></div>
        <div className={appStyles.bgYellowBlob}></div>
        <div className={appStyles.contentContainer}>
          {isAnalyzing ? (
            <div className={appStyles.analyzingWrapper}>
              <div className={appStyles.analyzingBox}>
                <div className={appStyles.analyzingPulse}></div>
                <div className={appStyles.analyzingInnerBox}>
                  <Loader2
                    className={appStyles.analyzingSpinner}
                    strokeWidth={2}
                  />
                </div>
                <div className={appStyles.analyzingBadge}>
                  <Sparkles
                    size={20}
                    fill="currentColor"
                    className="text-yellow-400"
                  />
                </div>
              </div>
              <h3 className={appStyles.analyzingTitle}>분석 중입니다...</h3>
              <p className={appStyles.analyzingDesc}>
                {userMajor
                  ? `${userMajor} 전공자에게 딱 맞는`
                  : "나에게 딱 맞는"}{" "}
                <br />
                꿀과목을 찾고 있어요 🍯
              </p>
            </div>
          ) : (
            <div className={appStyles.resultWrapper}>
              {!hasResults ? (
                <div className={appStyles.resultInnerWrapper}>
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
