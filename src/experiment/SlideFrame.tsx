import React from 'react';

interface SlideFrameProps {
  children: React.ReactNode;
  currentIndex: number;
  totalSlides: number;
  onBack: () => void;
  onNext: () => void;
  showBack: boolean;
}

export const SlideFrame: React.FC<SlideFrameProps> = ({ 
  children, currentIndex, totalSlides, onBack, onNext, showBack 
}) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#F4F6FC]">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Navigation Row */}
      <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0">
        <button 
          onClick={onBack}
          disabled={!showBack}
          className="px-6 py-3 rounded-full border border-slate-300 font-bold text-sm text-slate-600 disabled:opacity-0"
        >
          ← Back
        </button>

        <div className="flex gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all ${
                i === currentIndex ? 'w-8 bg-[#3B4FE0]' : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button 
          onClick={onNext}
          className="px-8 py-3 rounded-full bg-[#3B4FE0] text-white font-bold text-sm shadow-md"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
