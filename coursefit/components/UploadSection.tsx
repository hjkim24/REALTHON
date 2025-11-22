import {
  AlertCircle,
  BookOpenCheck,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { AnalysisType } from "../types";
interface UploadSectionProps {
  onAnalyze: (file: File, type: AnalysisType, major: string) => void; // response 대신 file
  isAnalyzing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isAnalyzing,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [userMajor, setUserMajor] = useState("");
  const [inputError, setInputError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const majorInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // <-- 여기! 파일을 FormData로 직접 전송
  // components/UploadSection.tsx의 handleAnalysisClick 수정
const handleAnalysisClick = async (type: AnalysisType) => {
  if (!file) return;

  // Major 분석시 전공명 필수
  if (type === AnalysisType.MAJOR && !userMajor.trim()) {
    setInputError(true);
    majorInputRef.current?.focus();
    return;
  }
  setInputError(false);

  // postImageFile 호출 제거 - App.tsx에서 처리
  onAnalyze(file, type, userMajor); // 파일과 타입, 전공명만 전달
};

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-slide-up">
      {/* 파일 선택 및 드래그앤드랍 영역 */}
      <div
        className={`group relative w-full h-56 rounded-3xl border-[3px] border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
          ${
            file
              ? "bg-blue-50/30 border-blue-300 border-solid ring-4 ring-blue-50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
          }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />
        {file ? (
          <div className="flex flex-col items-center animate-fade-in p-6 w-full">
            <div className="w-16 h-16 bg-white rounded-2xl shadow border border-blue-100 flex items-center justify-center text-blue-600 mb-3">
              <FileSpreadsheet size={32} />
            </div>
            <p className="font-bold text-lg text-slate-800 truncate max-w-xs">
              {file.name}
            </p>
            <p className="text-sm text-blue-500 font-medium mt-1">
              업로드 준비 완료
            </p>
            <button
              onClick={handleRemoveFile}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
              <Upload size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-600 group-hover:text-indigo-900 transition-colors">
                파일을 드래그하거나 클릭하세요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Major Input Section (그대로 유지) */}
      <div className="relative group z-10">
        <div
          className={`absolute inset-0 bg-red-100 rounded-2xl blur transition-opacity duration-300 ${
            inputError ? "opacity-100" : "opacity-0"
          }`}
        ></div>
        <div
          className={`relative flex items-center bg-white border-2 rounded-2xl p-4 shadow-sm transition-all duration-300 ${
            inputError
              ? "border-red-400 ring-2 ring-red-100"
              : "border-slate-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50"
          }`}
        >
          <BookOpenCheck
            className={`mr-4 transition-colors ${
              inputError ? "text-red-500" : "text-indigo-400"
            }`}
          />
          <input
            ref={majorInputRef}
            type="text"
            placeholder="현재 전공학과를 입력해주세요 (전공 분석시 필수)"
            value={userMajor}
            onChange={(e) => {
              setUserMajor(e.target.value);
              if (e.target.value) setInputError(false);
            }}
            className="w-full bg-transparent font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {inputError && (
            <AlertCircle
              size={20}
              className="text-red-500 animate-pulse ml-2"
            />
          )}
        </div>
        {inputError && (
          <p className="absolute -bottom-6 left-2 text-xs font-bold text-red-500 animate-bounce">
            전공 분석을 위해 학과를 입력해주세요!
          </p>
        )}
      </div>

      {/* 분석 버튼들 */}
      <div className="grid grid-cols-2 gap-5 mt-1">
        <button
          onClick={() => handleAnalysisClick(AnalysisType.GENERAL)}
          disabled={!file || isAnalyzing}
          className="rounded-2xl p-5 text-left transition-all border bg-white border-slate-100 hover:border-purple-500"
        >
          <div className="font-black text-slate-900">교양과목 분석</div>
        </button>
        <button
          onClick={() => handleAnalysisClick(AnalysisType.MAJOR)}
          disabled={!file || isAnalyzing}
          className="rounded-2xl p-5 text-left transition-all border bg-white border-slate-100 hover:border-blue-500"
        >
          <div className="font-black text-slate-900">전공과목 분석</div>
        </button>
      </div>
    </div>
  );
};

export default UploadSection;
