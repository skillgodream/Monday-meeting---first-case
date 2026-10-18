import React from 'react';
import { motion } from 'framer-motion';
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

      {/* 2. Center Hero Visual: Character on Apple VisionOS Frosted Liquid Glass Backcard */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 shrink-0">
        <div className="relative w-80 h-80 sm:w-[390px] sm:h-[390px] flex items-center justify-center p-3">
          {/* Soft Volumetric Backlight Behind the Glass (creates real optical refraction through the frost) */}
          <div className="absolute -inset-2 rounded-[52px] pointer-events-none opacity-80">
            <div className="absolute top-4 left-6 w-44 h-44 rounded-full bg-white/15 blur-[55px]" />
            <div className="absolute bottom-6 right-6 w-48 h-48 rounded-full bg-sky-400/15 blur-[65px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-indigo-400/10 blur-[60px]" />
          </div>

          {/* Apple VisionOS Frosted Glass Backcard */}
          <div
            className="absolute inset-0 rounded-[46px] backdrop-blur-3xl backdrop-saturate-150 border border-white/25 shadow-[inset_0_1.5px_1.5px_rgba(255,255,255,0.6),inset_1px_0_1px_rgba(255,255,255,0.25),inset_0_-1.5px_2px_rgba(255,255,255,0.14),0_30px_70px_-10px_rgba(0,0,0,0.85),0_0_45px_rgba(255,255,255,0.06)] overflow-hidden pointer-events-none"
            style={{
              background:
                'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.09) 38%, rgba(255,255,255,0.04) 72%, rgba(255,255,255,0.12) 100%)',
            }}
          >
            {/* Top specular rim reflection shimmer */}
            <div className="absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />

            {/* Left edge vertical specular highlight */}
            <div className="absolute inset-y-8 left-0 w-[1px] bg-gradient-to-b from-white/55 via-white/15 to-transparent" />

            {/* Diagonal Apple glass surface sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(125deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 58%)',
              }}
            />

            {/* Soft top-left radial lens flare */}
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-white/15 blur-2xl" />

            {/* Subtle bottom-right inner glass rim glow */}
            <div className="absolute -bottom-16 -right-16 w-52 h-52 rounded-full bg-sky-300/10 blur-2xl" />

            {/* Bottom edge subtle refraction line */}
            <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
          
          {/* Hero Presentation Image inside the Apple Glass Card */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden rounded-[36px]"
          >
            <img
              src="/Guruji App Coach Presentation.png"
              alt="Coach Guruji Presentation"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_22px_38px_rgba(0,0,0,0.75)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = gurujiImg;
              }}
            />
          </motion.div>
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full h-12 sm:h-13 rounded-full bg-white/[0.12] hover:bg-white/[0.18] active:bg-white/[0.22] backdrop-blur-2xl text-white font-semibold text-sm sm:text-base border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_12px_30px_rgba(0,0,0,0.6)] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <span>Tap to explore</span>
          <span className="text-lg">→</span>
        </motion.button>
      </div>
    </div>
  );
};
