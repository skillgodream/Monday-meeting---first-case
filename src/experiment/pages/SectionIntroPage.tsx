import React, { useState } from 'react';
import { Slide } from '../types';
import { findBestVisualMatch } from '../../utils/visualLibraryMatcher';
import { CheckCircle2, ListOrdered, Sparkles } from 'lucide-react';

export const SectionIntroPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const isPrerequisiteChecklist =
    slide.sec?.toLowerCase().includes('before') ||
    slide.sec?.toLowerCase().includes('prep') ||
    slide.title?.toLowerCase().includes('ready') ||
    slide.title?.toLowerCase().includes('prereq');

  const secBadge = slide.sec || slide.tag || (isPrerequisiteChecklist ? 'Before you start' : 'Process Overview');

  // Process slide fl items dynamically from extracted SOP
  const rawItems: string[] = slide.fl || [];

  const items = rawItems.map((raw, idx) => {
    const parts = raw.split(/(?<!\d)[:\-\–](?!\d)\s*/);
    let title = '';
    let subtitle = '';

    if (parts.length > 1 && parts[0].trim().length < 50) {
      title = parts[0]?.trim();
      subtitle = parts.slice(1).join(' ').trim();
    } else {
      const words = raw.trim().split(/\s+/);
      if (words.length > 6) {
        title = words.slice(0, 5).join(' ');
        subtitle = words.slice(5).join(' ');
      } else {
        title = raw.trim();
        subtitle = isPrerequisiteChecklist
          ? 'Required prerequisite for this procedure.'
          : `Step ${idx + 1} operational directive.`;
      }
    }

    // Format title and subtitle cleanly
    title = title.charAt(0).toUpperCase() + title.slice(1);
    subtitle = subtitle ? subtitle.charAt(0).toUpperCase() + subtitle.slice(1) : '';

    // Run dynamic visual match on this specific item text
    const itemMatch = findBestVisualMatch(raw, slide.title || '');
    const itemImg = itemMatch.url || '';

    return {
      title,
      subtitle,
      img: itemImg,
    };
  });

  // Track checked states for tapping each card
  const [checkedStates, setCheckedStates] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedStates((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checkedCount = Object.values(checkedStates).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#431407] rounded-3xl p-5 text-white relative overflow-hidden shadow-lg flex items-center justify-between min-h-[130px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute -left-5 -bottom-5 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-2 z-10 max-w-[70%] text-left">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide backdrop-blur-sm text-white">
            <Sparkles className="w-3.5 h-3.5 text-white inline shrink-0" />
            <span className="text-white">{secBadge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white">
            {slide.title || (isPrerequisiteChecklist ? 'Preparation & Setup' : 'Process Overview')}
          </h2>

          {slide.content && (
            <p className="text-xs font-semibold text-purple-100/90 leading-snug">
              {slide.content}
            </p>
          )}
        </div>

        {/* Right side indicator: Progress ring for checklist, or step count badge for workflow */}
        {isPrerequisiteChecklist ? (
          <div className="relative w-18 h-18 flex items-center justify-center shrink-0 z-10 mr-1">
            <svg className="absolute w-full h-full -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="26"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="5"
                fill="none"
              />
              <circle
                cx="36"
                cy="36"
                r="26"
                stroke="#ffffff"
                strokeWidth="5"
                fill="none"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - (items.length ? checkedCount / items.length : 0))}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="text-center leading-none z-10">
              <div className="text-base font-black text-white">{checkedCount}/{items.length}</div>
              <div className="text-[9px] font-black text-white/80 tracking-widest uppercase mt-0.5">ready</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center shrink-0 z-10 mr-1 px-3 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md">
            <ListOrdered className="w-5 h-5 text-amber-300 mb-0.5" />
            <span className="text-base font-black text-white leading-none">{items.length}</span>
            <span className="text-[9px] font-black text-white/75 tracking-wider uppercase mt-0.5">steps</span>
          </div>
        )}
      </div>

      {/* 2. Counter / Instruction label */}
      {items.length > 0 && (
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mt-2.5 text-left">
          {isPrerequisiteChecklist ? 'TAP EACH ITEM AS YOU VERIFY IT' : 'WORKFLOW STAGES'}
        </div>
      )}

      {/* 3. Dynamic Items list */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const isChecked = checkedStates[idx];

            return (
              <div
                key={idx}
                onClick={isPrerequisiteChecklist ? () => toggleCheck(idx) : undefined}
                className={`relative rounded-2xl p-4 transition-all duration-300 flex items-center gap-3.5 select-none border ${
                  isPrerequisiteChecklist ? 'cursor-pointer' : ''
                } ${
                  isChecked
                    ? 'bg-emerald-50/80 border-emerald-400 shadow-xs'
                    : 'bg-white border-[#E3E8F4] hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Step / Thumbnail badge */}
                {item.img ? (
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-[#E3E8F4] shadow-2xs bg-slate-100">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-black text-xs">
                    {idx + 1}
                  </div>
                )}

                {/* Title & Subtitle */}
                <div className="flex-1 text-left space-y-0.5 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[#0F1B3D] leading-snug">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-xs font-normal text-[#3C4660] leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                {/* Checked Indicator Ring if checklist */}
                {isPrerequisiteChecklist && (
                  <div className="shrink-0 pl-1">
                    {isChecked ? (
                      <div className="w-6 h-6 rounded-full bg-[#2FA866] border-2 border-white flex items-center justify-center shadow-md scale-105">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-[#E3E8F4] hover:border-slate-400 transition-colors bg-white" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-sm">
          {slide.content || 'Review the procedural details in the upcoming steps.'}
        </div>
      )}
    </div>
  );
};

