const resultsSectionStyles = {
  wrapper: "w-full max-w-5xl mx-auto flex flex-col animate-slide-up pb-12",

  navHeader: "mb-6 flex-shrink-0",
  resetButton:
    "group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4",
  resetButtonIcon:
    "p-2 rounded-full bg-white border border-slate-200 group-hover:border-black group-hover:shadow-md transition-all",
  resetButtonText: "font-bold text-sm",

  headerContainer:
    "flex items-end justify-between border-b-2 border-slate-100 pb-6",
  title: "text-3xl font-black text-slate-900 tracking-tight",
  subtitle: "text-slate-500 mt-2 font-medium",
  highlight: "text-blue-600 font-extrabold",
  analysisTypeLabel:
    "px-5 py-2 rounded-2xl font-bold text-sm flex items-center gap-2 border-2",
  analysisTypeGeneral: "bg-purple-50 text-purple-700 border-purple-100",
  analysisTypeMajor: "bg-blue-50 text-blue-700 border-blue-100",

  contentArea: "space-y-4",

  card: "bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden",

  cardInner: "flex flex-col md:flex-row md:items-start gap-6",

  courseInfo: "flex-1 min-w-0",
  courseTag:
    "px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider",
  courseName: "text-xl font-extrabold text-slate-900 truncate",
  courseMetaContainer: "flex gap-3 text-xs font-bold text-slate-500 mb-4",
  courseMetaItem: "bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200",

  difficultyLabel: "text-xs font-bold text-slate-400",
  starsContainer: "flex items-center gap-0.5",
  starFilled: "fill-yellow-400 text-yellow-400",
  starEmpty: "text-slate-200 fill-slate-200",

  reasonCardContainer: "flex-[1.5] relative",
  reasonCard: "bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full",
  reasonContent: "flex items-start gap-3",
  reasonIconContainer: "mt-0.5 min-w-[20px] text-blue-600",
  reasonText: "text-sm text-slate-600 leading-relaxed font-medium",

  newAnalysisContainer: "pt-8 pb-4",
  separator: "border-t-2 border-dashed border-slate-200 mb-8",
  newAnalysisButtonContainer: "flex justify-center",
  newAnalysisButton:
    "group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 w-full md:w-auto justify-center",
  newAnalysisIcon: "group-hover:rotate-90 transition-transform duration-500",
  similarityText: "ml-2 text-indigo-400 font-semibold text-sm",
  similarityLabel: "mr-2 text-slate-500 font-bold text-xs",
};

export default resultsSectionStyles;
