import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, BookOpenCheck, AlertCircle } from 'lucide-react';
import { AnalysisType } from '../types';

interface UploadSectionProps {
  onAnalyze: (file: File, type: AnalysisType, major: string) => void;
  isAnalyzing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [userMajor, setUserMajor] = useState('');
  const [inputError, setInputError] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const majorInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalysisClick = (type: AnalysisType) => {
    if (!file) return;

    // Validation: Require major for Major Analysis
    if (type === AnalysisType.MAJOR && !userMajor.trim()) {
        setInputError(true);
        majorInputRef.current?.focus();
        return;
    }

    setInputError(false);
    onAnalyze(file, type, userMajor);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-slide-up">
      
      {/* Upload Area */}
      <div className="relative">
         {/* Colorful background blur */}
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-300 via-purple-200 to-pink-200 rounded-[2.5rem] blur opacity-60"></div>
         <div className="relative bg-white rounded-[2rem] border border-white/50 shadow-xl p-8 overflow-hidden">
            
            <div className="flex items-center gap-3 mb-6">
                {/* Updated Icon Container - White Background, Indigo Lines */}
                <div className="p-2.5 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl shadow-lg shadow-indigo-100 transform -rotate-3 ring-2 ring-white">
                    <FileSpreadsheet size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">성적표 업로드</h3>
                <span className="text-[10px] font-bold text-indigo-500 border border-indigo-100 bg-indigo-50 px-2 py-1 rounded-full ml-auto shadow-sm">PDF / JPG / PNG</span>
            </div>

            <div 
                className={`group relative w-full h-56 rounded-3xl border-[3px] border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
                ${dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
                ${file ? 'bg-blue-50/30 border-blue-300 border-solid ring-4 ring-blue-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
            >
                <input 
                    ref={inputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleChange}
                />

                {file ? (
                    <div className="flex flex-col items-center animate-fade-in p-6 w-full">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-blue-100 flex items-center justify-center text-blue-600 mb-3">
                            <FileSpreadsheet size={32} />
                        </div>
                        <p className="font-bold text-lg text-slate-800 truncate max-w-xs">{file.name}</p>
                        <p className="text-sm text-blue-500 font-medium mt-1">업로드 준비 완료</p>
                        <button 
                            onClick={removeFile}
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
         </div>
      </div>

      {/* Major Input Section */}
      <div className="relative group z-10">
         <div className={`absolute inset-0 bg-red-100 rounded-2xl blur transition-opacity duration-300 ${inputError ? 'opacity-100' : 'opacity-0'}`}></div>
         <div className={`relative flex items-center bg-white border-2 rounded-2xl p-4 shadow-sm transition-all duration-300 ${inputError ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50'}`}>
            <BookOpenCheck className={`mr-4 transition-colors ${inputError ? 'text-red-500' : 'text-indigo-400'}`} />
            <input 
                ref={majorInputRef}
                type="text"
                placeholder="현재 전공학과를 입력해주세요 (전공 분석시 필수)"
                value={userMajor}
                onChange={(e) => {
                    setUserMajor(e.target.value);
                    if(e.target.value) setInputError(false);
                }}
                className="w-full bg-transparent font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {inputError && <AlertCircle size={20} className="text-red-500 animate-pulse ml-2" />}
         </div>
         {inputError && <p className="absolute -bottom-6 left-2 text-xs font-bold text-red-500 animate-bounce">전공 분석을 위해 학과를 입력해주세요!</p>}
      </div>

      {/* Buttons Area */}
      <div className="grid grid-cols-2 gap-5 mt-1">
        {/* General Button */}
        <button
            onClick={() => handleAnalysisClick(AnalysisType.GENERAL)}
            disabled={!file || isAnalyzing}
            className={`relative group overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border-2
            ${!file || isAnalyzing 
                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' 
                : 'bg-white border-slate-100 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-1 active:translate-y-0 active:shadow-none'}
            `}
        >
            <div className="relative z-10">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300">
                    🎨
                </div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-purple-700">교양과목 분석</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">창의적이고 흥미로운<br/>교양 과목 찾기</p>
            </div>
        </button>

        {/* Major Button */}
        <button
            onClick={() => handleAnalysisClick(AnalysisType.MAJOR)}
            disabled={!file || isAnalyzing}
            className={`relative group overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border-2
            ${!file || isAnalyzing 
                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed' 
                : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 active:translate-y-0 active:shadow-none'}
            `}
        >
            <div className="relative z-10">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
                    🎓
                </div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-700">전공과목 분석</h4>
                <p className="text-xs font-medium text-slate-500 mt-1">내 성적에 맞춘<br/>최적의 전공 추천</p>
            </div>
        </button>
      </div>
    </div>
  );
};

export default UploadSection;