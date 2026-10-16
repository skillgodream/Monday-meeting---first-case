import React from 'react';
import { Slide } from '../types';
import { Target, CheckCircle2, Compass, Award, ListChecks } from 'lucide-react';

export const ObjectivesPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const lead = slide.lead || 'By the end of this module, you will be able to:';

  let items = slide.items;
  if (!items || items.length === 0) {
    items = (slide.content || '')
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);
  }

  // Ensure content limit of dynamic goals
  const finalItems = items.slice(0, 4);

  // Universal semantic icons based on position
  const getGoalIcon = (index: number) => {
    switch (index % 4) {
      case 0:
        return <Target className="w-5 h-5 text-[#1d3cb4]" />;
      case 1:
        return <CheckCircle2 className="w-5 h-5 text-[#1d3cb4]" />;
      case 2:
        return <Compass className="w-5 h-5 text-[#1d3cb4]" />;
      case 3:
      default:
        return <Award className="w-5 h-5 text-[#1d3cb4]" />;
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* 1. Header Hero Card (compact size, light style) */}
      <div className="bg-gradient-to-br from-[#1d3cb4] via-[#2462e3] to-[#4c84ff] rounded-3xl p-5 text-white relative overflow-hidden shadow-lg flex items-center justify-between min-h-[140px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(255,255,255,0.12),transparent_50%)]" />

        <div className="space-y-2 z-10 max-w-[65%]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide backdrop-blur-sm text-white">
            <ListChecks className="w-3.5 h-3.5 text-white inline shrink-0" />
            <span className="text-white">{slide.tag || 'Learning Objectives'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
            {slide.title || 'What you will learn'}
          </h2>

          <p className="text-xs font-semibold text-blue-100/90 leading-snug">
            {lead}
          </p>
        </div>

        <div className="relative w-20 h-20 shrink-0 z-10 mr-1 select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white/95" stroke="currentColor" strokeWidth="2.5" fill="none">
            <circle cx="50" cy="50" r="38" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
            <circle cx="50" cy="50" r="28" stroke="rgba(255,255,255,0.3)" strokeWidth="6" />
            <circle cx="50" cy="50" r="18" stroke="rgba(255,255,255,0.5)" strokeWidth="6" />
            <circle cx="50" cy="50" r="8" stroke="rgba(255,255,255,0.8)" strokeWidth="4" />
            <circle cx="50" cy="50" r="3" fill="#f59e0b" stroke="#f59e0b" />
            <line x1="18" y1="82" x2="78" y2="22" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            <polyline points="58 22 78 22 78 42" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 2. Goals counter label */}
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mt-3">
        {finalItems.length} OBJECTIVES
      </div>

      {/* 3. List of Beautiful Goals cards (light style) */}
      <div className="space-y-3">
        {finalItems.map((item, index) => {
          const paddedNum = String(index + 1).padStart(2, '0');
          return (
            <div
              key={index}
              className="relative bg-white rounded-2xl p-4 pl-6 border border-[#E3E8F4] shadow-xs flex items-center gap-4 min-h-[72px] overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#1d3cb4] rounded-l-2xl" />

              <div className="w-10 h-10 rounded-xl bg-[#eff6ff] text-[#1d3cb4] flex items-center justify-center shrink-0 shadow-2xs">
                {getGoalIcon(index)}
              </div>

              <div className="flex-1 space-y-0.5 text-left pr-2">
                <div className="text-xs font-black text-[#1d3cb4] tracking-wider">
                  {paddedNum}
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#0F1B3D] leading-tight">
                  {item}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

