import React from "react";
import { History, BookOpen } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="w-full flex justify-between items-center p-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="bg-primary-600 text-white p-1.5 rounded-lg shadow-md">
          <BookOpen size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-primary-900 text-lg leading-none tracking-tight">
            CourseFit
          </span>
          <span className="text-[10px] text-primary-400 font-medium tracking-widest uppercase">
            AI Advisor
          </span>
        </div>
      </div>
      <button
        className="flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all text-xs font-bold shadow-sm hover:shadow-md active:scale-95"
        type="button"
      >
        <History className="w-3.5 h-3.5 mr-1.5" />
        지난번 분석
      </button>
    </header>
  );
};

export default Header;
