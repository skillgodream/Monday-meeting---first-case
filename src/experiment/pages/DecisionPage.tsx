import React, { useState } from 'react';
import { Slide } from '../types';
import { ArrowRight, Check, X, HelpCircle, AlertCircle } from 'lucide-react';

/** Strips backend metadata, category badges, and description text from option cards */
function cleanOptionText(rawText: string): string {
  if (!rawText) return '';
  let text = String(rawText).trim();

  // 1. Take only the primary title if text contains line breaks
  if (text.includes('\n')) {
    text = text.split('\n')[0].trim();
  }

  // 2. Remove leading badges/tags like [ACCEPT / PASS], ACCEPT / PASS, etc.
  text = text
    .replace(/^\[?\s*(ACCEPT\s*\/\s*PASS|ACCEPT\s*\/\s*REJECT|DO\s*\/\s*DONT|MANDATORY|COMPLIANT|NON-COMPLIANT|PASSED|FAILED)\s*\]?:?\s*/i, '')
    .trim();

  // 3. Remove trailing backend rationale or failure mode descriptions starting after separators (—, |, -)
  text = text
    .replace(/\s*[—–|-]\s*(Compliant SOP|Failure mode|Safety\/compliance hazard|Operational rule|Rationale|SOP requirement|Violates).*$/i, '')
    .trim();

  // 4. Remove standalone backend phrases if present
  text = text
    .replace(/\s*(Compliant SOP standard procedure|Failure mode:.*|Safety\/compliance hazard:.*|Operational rule:.*)$/i, '')
    .trim();

  return text;
}

export const DecisionPage: React.FC<{
  slide: Slide;
  onChoiceSelect: (isCorrect: boolean, feedback: string) => void;
  feedback?: string | null;
  onNext?: () => void;
}> = ({ slide, onChoiceSelect, onNext }) => {
  // Extract options from slide
  const options = (slide.opts || []).length > 0
    ? (slide.opts || []).map((o) => ({
        text: o.t,
        why: o.why,
        isCorrect: Boolean(o.ok),
      }))
    : (slide.choices || []).map((c) => ({
        text: c.text,
        why: c.feedback || c.why || '',
        isCorrect: Boolean(c.isCorrect),
      }));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const handleSelect = (index: number) => {
    // If already checked and solved, don't allow changing
    if (isChecked && isCorrect) return;

    setSelectedIndex(index);
    if (isChecked && !isCorrect) {
      // Learner picked a new option after a wrong attempt, reset checked state
      setIsChecked(false);
      setFeedbackText('');
    }
  };

  const handleAction = () => {
    if (options.length === 0) {
      if (onNext) onNext();
      return;
    }

    if (selectedIndex === null) return;

    if (isChecked && isCorrect) {
      if (onNext) onNext();
      return;
    }

    const opt = options[selectedIndex];
    if (!opt) return;

    setIsChecked(true);
    setFeedbackText(opt.why);

    if (opt.isCorrect) {
      setIsCorrect(true);
      onChoiceSelect(true, opt.why);
    } else {
      setIsCorrect(false);
      onChoiceSelect(false, opt.why);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-4 select-none pb-4 px-1">
      {/* 1. TOP HERO CARD with integrated Question Icon */}
      <div className="bg-gradient-to-r from-[#0a1e4a] via-[#0e2760] to-[#122b68] border border-blue-500/30 rounded-2xl sm:rounded-[22px] p-5 shadow-[0_8px_30px_rgba(10,30,74,0.35)] relative overflow-hidden flex items-center justify-between gap-3 text-left">
        {/* Subtle top specular glass highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Heading: What should you Do? */}
        <div className="flex-1 min-w-0 z-10">
          <div className="text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1">
            {slide.tag || 'DECISION POINT'}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight text-white">
            {slide.title || 'What should you do?'}
          </h2>
        </div>

        {/* Question Mark Badge inside the Hero Card */}
        <div className="w-12 h-12 rounded-full border border-blue-400/40 bg-blue-900/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)] text-sky-400 z-10">
          <HelpCircle className="w-6 h-6 text-sky-400" />
        </div>
      </div>

      {/* Contextual Scenario / Instruction text */}
      {slide.content && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/40 text-left text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {slide.content}
        </div>
      )}

      {/* 2. IMAGE SLOT if available */}
      {slide.img && (
        <div className="relative aspect-[16/10] w-full max-h-[220px] rounded-2xl overflow-hidden bg-[#091326] border border-blue-900/40 shrink-0 shadow-sm">
          <img
            src={slide.img}
            alt={slide.title || 'Decision context visual'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-2xl transition-opacity duration-300"
          />
        </div>
      )}

      {/* 3. OPTIONS LIST or Controlled Explicit State */}
      {options.length > 0 ? (
        <div className="flex flex-col gap-3">
          {options.map((opt, j) => {
            const isSelected = selectedIndex === j;
            const isThisCorrect = opt.isCorrect;

            let cardStyle =
              'bg-[#091326] border border-blue-900/40 hover:border-blue-500/60';
            if (!isChecked) {
              if (isSelected) {
                cardStyle =
                  'bg-[#0c1a36] border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]';
              }
            } else {
              if (isThisCorrect) {
                cardStyle =
                  'bg-emerald-950/40 border-2 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
              } else if (isSelected && !isThisCorrect) {
                cardStyle =
                  'bg-rose-950/40 border-2 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.25)]';
              } else {
                cardStyle = 'bg-[#091326]/60 border border-blue-950/40 opacity-50';
              }
            }

            return (
              <div
                key={j}
                onClick={() => handleSelect(j)}
                className={`group rounded-2xl p-4 transition-all duration-200 flex items-center gap-4 cursor-pointer select-none ${cardStyle}`}
              >
                {/* Prominent Dot/Circle Radio Option Indicator */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isChecked
                      ? isThisCorrect
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                        : isSelected
                        ? 'border-rose-400 bg-rose-500/20 shadow-[0_0_10px_rgba(251,113,133,0.3)]'
                        : 'border-slate-600/60 bg-slate-900/40'
                      : isSelected
                      ? 'border-sky-400 bg-sky-500/20 shadow-[0_0_10px_rgba(56,189,248,0.35)] scale-105'
                      : 'border-slate-500/60 bg-slate-900/40 group-hover:border-sky-400/80 group-hover:bg-sky-500/10'
                  }`}
                >
                  {isChecked ? (
                    isThisCorrect ? (
                      <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                    ) : isSelected ? (
                      <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm" />
                    ) : null
                  ) : isSelected ? (
                    <div className="w-3 h-3 rounded-full bg-sky-400 shadow-sm" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-sky-400/40 transition-all" />
                  )}
                </div>

                {/* Option Text (clean title only, no backend description/subtitle) */}
                <span className="text-sm sm:text-base font-semibold text-white/95 flex-1 text-left leading-snug">
                  {cleanOptionText(opt.text)}
                </span>

                {/* Evaluated Status Icon on right */}
                {isChecked && (
                  <div className="shrink-0 ml-1">
                    {isThisCorrect ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-[#091326] border border-blue-900/40 text-left space-y-2">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Procedural Standard</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {slide.why || 'Review and apply the standard procedure outlined for this operational situation.'}
          </p>
        </div>
      )}

      {/* 4. FEEDBACK / RATIONALE CARD */}
      {isChecked && feedbackText && (
        <div
          className={`p-4 rounded-2xl border space-y-1 animate-in fade-in duration-200 ${
            isCorrect
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div
            className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              isCorrect ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span>{isCorrect ? '✓' : '✕'}</span>
            <span>{isCorrect ? 'Compliant Rationale' : 'Operational Caution'}</span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed opacity-95">
            {feedbackText}
          </p>
        </div>
      )}

      {/* 5. CHECK ANSWER / CONTINUE ACTION BUTTON */}
      <button
        onClick={handleAction}
        disabled={options.length > 0 && selectedIndex === null}
        className={`w-full py-4 px-6 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isChecked && isCorrect
            ? 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-[0_4px_25px_rgba(16,185,129,0.4)]'
            : 'bg-gradient-to-r from-[#0066fe] to-[#1b8aff] shadow-[0_4px_25px_rgba(0,102,254,0.4)] hover:brightness-110 active:scale-[0.99]'
        }`}
      >
        <span>
          {options.length === 0
            ? 'Continue'
            : isChecked && isCorrect
            ? 'Continue'
            : 'Check answer'}
        </span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};

