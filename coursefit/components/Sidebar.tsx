import React, { useState } from 'react';
import { GraduationCap, FileText, Clock, Sparkles, PlusCircle, Pencil } from 'lucide-react';
import { HistoryItem, AnalysisType } from '../types';

interface SidebarProps {
  historyItems: HistoryItem[];
  onNewAnalysis: () => void;
  onHistorySelect: (item: HistoryItem) => void;
  onRenameHistoryItem: (id: number, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ historyItems, onNewAnalysis, onHistorySelect, onRenameHistoryItem }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditClick = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.title);
  };

  const handleSave = (e: React.MouseEvent | React.FocusEvent | React.KeyboardEvent, id: number) => {
    e.stopPropagation();
    if (editValue.trim()) {
      onRenameHistoryItem(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      handleSave(e, id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xl shadow-slate-200/50 relative overflow-hidden">
      
      {/* Logo Area */}
      <div className="p-8 pb-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2 group cursor-pointer" onClick={onNewAnalysis}>
          {/* Custom Logo with Eyes - Reverted to Black as requested */}
          <div className="relative w-12 h-12 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_#0f172a] group-hover:shadow-[2px_2px_0px_0px_#0f172a] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all duration-200 flex items-center justify-center overflow-hidden">
            <GraduationCap size={28} strokeWidth={2.5} className="text-slate-900 relative z-10" />
            
            {/* Eyes Animation */}
            <div className="absolute top-[22px] left-[14px] w-[4px] h-[4px] bg-slate-900 rounded-full animate-pulse z-20 group-hover:scale-150 transition-transform"></div>
            <div className="absolute top-[22px] right-[14px] w-[4px] h-[4px] bg-slate-900 rounded-full animate-pulse z-20 delay-75 group-hover:scale-150 transition-transform"></div>
          </div>
          
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">CourseFit</span>
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1 flex items-center gap-1">
              AI Advisor <Sparkles size={8} className="text-yellow-500" />
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-0.5 bg-slate-100 mx-6 mb-4 flex-shrink-0"></div>

      {/* Previous Analysis Section (Scrollable) */}
      <div className="flex-grow flex flex-col min-h-0">
        <div className="px-6 pb-2 pt-2 flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock size={12} />
            지난번 분석
            </h3>
        </div>
        
        <div className="flex-grow overflow-y-auto px-6 py-2 space-y-3 no-scrollbar">
          {historyItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onHistorySelect(item)}
              className="group relative p-4 rounded-xl bg-white border border-slate-100 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all duration-200 overflow-hidden"
            >
              <div className={`absolute left-0 top-0 h-full w-1 transition-colors ${item.type === AnalysisType.MAJOR ? 'bg-blue-200 group-hover:bg-blue-600' : 'bg-purple-200 group-hover:bg-purple-600'}`}></div>
              <div className="flex items-start gap-3 pl-2">
                <FileText size={16} className="text-slate-400 group-hover:text-indigo-600 mt-0.5 transition-colors flex-shrink-0" />
                <div className="flex-grow min-w-0 relative">
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={(e) => handleSave(e, item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full text-sm font-bold text-slate-900 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-900 transition-colors truncate pr-6">
                        {item.title}
                      </p>
                      <button
                        onClick={(e) => handleEditClick(e, item)}
                        className="absolute right-[-8px] top-[-4px] p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="이름 변경"
                      >
                        <Pencil size={12} />
                      </button>
                    </>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{item.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Analysis Button (Fixed at bottom of list area) */}
        <div className="p-6 pt-4 flex-shrink-0">
            <button 
                onClick={onNewAnalysis}
                className="w-full group flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 font-bold text-sm"
            >
                <PlusCircle size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                새로운 분석 추가하기
            </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Running on <span className="font-bold text-slate-600">Gemini 2.5 Flash</span><br/>
          © 2024 CourseFit
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;