import React from 'react';
import { Target, Zap, TrendingUp, Star } from 'lucide-react';
const gurujiImg = "/Guruji App Coach Presentation.png";

interface MeetGurujiScreenProps {
  onContinue: () => void;
}

export const MeetGurujiScreen: React.FC<MeetGurujiScreenProps> = ({ onContinue }) => {
  return (
    <div 
      className="relative w-full min-h-[100dvh] sm:min-h-[780px] bg-black text-white overflow-hidden flex flex-col justify-between p-4 sm:p-6 select-none"
      onClick={onContinue}
    >
      {/* 1. Apple Spatial Ambient Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-white/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full bg-sky-500/[0.04] blur-[110px]" />
      </div>

      {/* 2. Center Hero Visual: Character directly on Pure Black Canvas (no backcard) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 shrink-0">
        <div className="relative w-80 h-80 sm:w-[400px] sm:h-[400px] flex items-center justify-center">
          <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-700">
            <picture className="w-full h-full flex items-center justify-center">
              <source srcSet="/guruji-coach.webp" type="image/webp" />
              <img
                src="/Guruji App Coach Presentation.png"
                alt="Coach Guruji Presentation"
                referrerPolicy="no-referrer"
                fetchPriority="high"
                decoding="sync"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = gurujiImg;
                }}
              />
            </picture>
          </div>
        </div>
      </div>

      {/* 3. Bottom Content Block: Pure Apple Dark Typography & CTA */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-4 pb-4 shrink-0 bg-transparent">
        {/* Headline & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Guruji
          </h1>
          <p className="text-[13px] text-slate-400 font-normal leading-relaxed max-w-[290px] sm:max-w-[320px] mx-auto pt-1">
            Frontline Coach
          </p>
        </div>

        {/* 4. Small Feature Indicators */}
        <div className="flex items-center justify-center gap-3 w-full py-1">
          {/* Indicator 1 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <Target className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-semibold text-slate-200">Learn</span>
          </div>

          {/* Indicator 2 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-semibold text-slate-200">Guide</span>
          </div>

          {/* Indicator 3 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <TrendingUp className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-semibold text-slate-200">Track</span>
          </div>

          {/* Indicator 4 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.25)]">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-200">Grow</span>
          </div>
        </div>

        {/* 5. Primary CTA Button: Sleek Translucent Apple Glass Tap to explore */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full h-12 sm:h-13 rounded-full bg-white/[0.12] hover:bg-white/[0.18] active:bg-white/[0.22] backdrop-blur-2xl text-white font-semibold text-sm sm:text-base border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_12px_30px_rgba(0,0,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <span>Tap to explore</span>
          <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
};
