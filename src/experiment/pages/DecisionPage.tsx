import React, { useState } from 'react';
import { Slide } from '../types';
import { Layers, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { findBestVisualMatch } from '../../utils/visualLibraryMatcher';

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

export interface DecisionPageProps {
  slide: Slide;
  onChoiceSelect: (isCorrect: boolean, feedback: string) => void;
  feedback?: string | null;
  onNext?: () => void;
}

export const DecisionPage: React.FC<DecisionPageProps> = ({
  slide,
  onChoiceSelect,
  onNext,
}) => {
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

  // Fallback high-resolution visual matching
  const photoUrl =
    slide.img ||
    findBestVisualMatch(slide.title || 'operational decision', slide.tag || 'SOP').url ||
    '/Guruji_Real_Photo_Visual_Library_500/001_retail_store_front.webp';

  const handleSelect = (index: number) => {
    // If already checked and solved correct, don't allow changing
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
    <div className="h-full overflow-y-auto flex flex-col gap-4 select-none pb-4 px-1 bg-[#FBFBFD] text-slate-900">
      
      {/* 1. BENTO HEADER SYSTEM */}
      <div className="space-y-1.5 text-left">
        {/* Row 1: Two Capsule Badges */}
        <div className="flex items-center gap-2">
          {/* Left Pill: Solid black capsule */}
          <span className="bg-black text-white text-[11px] font-bold rounded-full uppercase tracking-wide px-3.5 py-1 shadow-sm">
            {slide.tag || 'OPERATIONAL DECISION GATE'}
          </span>

          {/* Right Pill: Neutral grey layout badge */}
          <span className="bg-[#F1F3F5] text-slate-600 font-mono text-[10px] font-semibold border border-slate-200/90 rounded-full px-3 py-1 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>LAYOUT: BENTO_DECISION</span>
          </span>
        </div>

        {/* Row 2: Prominent Oversized Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-1">
          {slide.title || 'What is the Compliant Operational Decision?'}
        </h1>

        {/* Row 3: Context Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
          {slide.content ||
            'Evaluate live operational conditions against documented SOP standard rules. Zero unapproved improvisation permitted.'}
        </p>
      </div>

      {/* 2. SCENARIO TELEMETRY PHOTO CARD (Workplace Visual Anchor) */}
      <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm relative h-44 sm:h-52 w-full shrink-0">
        <img
          src={photoUrl}
          alt={slide.title || 'Decision context visual'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-mono font-bold px-3.5 py-1 rounded-full">
          • TELEMETRY: Active Decision Boundary Evaluation
        </div>
      </div>

      {/* 3. ELEVATED BENTO DECISION CARDS */}
      {options.length > 0 ? (
        <div className="flex flex-col gap-3">
          {options.map((opt, j) => {
            const isSelected = selectedIndex === j;
            const isThisCorrect = opt.isCorrect;
            const optionLabel = `OPTION ${String.fromCharCode(65 + j)}`;

            let cardStyle =
              'bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs';

            if (!isChecked) {
              if (isSelected) {
                cardStyle =
                  'bg-slate-50/70 border-2 border-black shadow-md ring-1 ring-black/5';
              }
            } else {
              if (isThisCorrect) {
                cardStyle =
                  'bg-emerald-50/70 border-2 border-emerald-500 text-emerald-950 shadow-sm';
              } else if (isSelected && !isThisCorrect) {
                cardStyle =
                  'bg-rose-50/70 border-2 border-rose-500 text-rose-950 shadow-sm';
              } else {
                cardStyle = 'bg-white/60 border border-slate-200 opacity-40';
              }
            }

            return (
              <div
                key={j}
                onClick={() => handleSelect(j)}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer select-none space-y-2 text-left ${cardStyle}`}
              >
                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                    {optionLabel}
                  </span>

                  {/* Dynamic Status Indicator Badge */}
                  {!isChecked ? (
                    isSelected && (
                      <span className="bg-black text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                        SELECTED
                      </span>
                    )
                  ) : isThisCorrect ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>COMPLIANT STANDARD</span>
                    </span>
                  ) : isSelected && !isThisCorrect ? (
                    <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                      <span>PROHIBITED DEVIATION</span>
                    </span>
                  ) : null}
                </div>

                {/* Main Choice Title */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {cleanOptionText(opt.text)}
                </h3>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs text-left space-y-2">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-mono font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>PROCEDURAL STANDARD SPECIFICATION</span>
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {slide.why || 'Review and apply the standard procedure outlined for this operational situation.'}
          </p>
        </div>
      )}

      {/* 4. RATIONALE & FEEDBACK BENTO CARD */}
      {isChecked && feedbackText && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border space-y-1.5 text-left animate-in fade-in duration-200 ${
            isCorrect
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}
        >
          <div
            className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isCorrect ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            {isCorrect ? (
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-700" />
            )}
            <span>{isCorrect ? 'Compliant SOP Rationale' : 'Operational Risk Warning'}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            {feedbackText}
          </p>
        </div>
      )}

      {/* 5. PRIMARY ACTION BUTTON */}
      <button
        onClick={handleAction}
        disabled={options.length > 0 && selectedIndex === null}
        className={`w-full py-4 px-6 rounded-full text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          isChecked && isCorrect
            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.99]'
            : 'bg-black hover:bg-slate-800 shadow-md active:scale-[0.99]'
        }`}
      >
        <span>
          {options.length === 0
            ? 'Continue to Next Gate →'
            : isChecked && isCorrect
            ? 'Continue to Next Gate →'
            : 'Confirm Decision →'}
        </span>
        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
      </button>

    </div>
  );
};
