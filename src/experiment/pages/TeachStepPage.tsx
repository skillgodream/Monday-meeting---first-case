import React from 'react';
import { ShieldCheck, Lightbulb, ArrowRight, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { Slide } from '../types';
import { ImageSlot } from '../tokens';

export const TeachStepPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const stepLabel = slide.step || slide.tag || 'Step 1 of 1';

  // 1. Extract raw items from slide.items or slide.content
  let rawItems: string[] = [];
  if (slide.items && slide.items.length > 0) {
    rawItems = [...slide.items];
  } else if (slide.content) {
    rawItems = slide.content
      .split('\n')
      .map((l) => l.replace(/^[\*\-•\d\.]\s*/, '').trim())
      .filter(Boolean);
  }

  // 2. Extract or categorize fields for the 3 distinct cards
  let actionText = '';
  let whyText = slide.why || '';
  let tipText = slide.nb || '';
  const extraItems: string[] = [];

  rawItems.forEach((item, idx) => {
    const itemLower = item.toLowerCase();
    if (
      itemLower.startsWith('why it matters:') ||
      itemLower.startsWith('why:') ||
      itemLower.startsWith('rationale:') ||
      itemLower.startsWith('reason:')
    ) {
      whyText = item.replace(/^(why it matters:|why:|rationale:|reason:)\s*/i, '');
    } else if (
      itemLower.startsWith('tip:') ||
      itemLower.startsWith('pro tip:') ||
      itemLower.startsWith('coach tip:') ||
      itemLower.startsWith('watch-out:') ||
      itemLower.startsWith('field tip:') ||
      itemLower.startsWith('note:')
    ) {
      tipText = item.replace(/^(tip:|pro tip:|coach tip:|watch-out:|field tip:|note:)\s*/i, '');
    } else if (idx === 0 && !actionText) {
      actionText = item;
    } else if (idx === 1 && !whyText) {
      whyText = item;
    } else if (idx === 2 && !tipText) {
      tipText = item;
    } else {
      extraItems.push(item);
    }
  });

  // Fallback for action text
  if (!actionText) {
    actionText = slide.lead || slide.title || 'Perform primary standard operating procedure step.';
  }

  return (
    <div className="flex flex-col gap-5 select-none relative">
      {/* Background Subtle Glow Halos */}
      <div className="aria-hidden:true pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="aria-hidden:true pointer-events-none absolute top-1/2 -right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      {/* Main Content Layout Architecture */}
      <div className="flex flex-col gap-4">
        {/* HERO CARD: PRIMARY TASK DIRECTIVE */}
        <div className="group relative p-5 rounded-2xl bg-[#121622] backdrop-blur-2xl border border-white/10 shadow-xl transition-all duration-300">
          <div className="flex flex-col gap-1.5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 backdrop-blur-md shadow-sm">
                PRIMARY TASK DIRECTIVE
              </span>
            </div>

            {/* Striking Bold Primary Action with Soft Sky Blue -> Lavender -> Muted Pink Gradient */}
            <p className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent leading-snug tracking-tight mt-2">
              {actionText}
            </p>
          </div>
        </div>

        {/* ASYMMETRIC SUB-PANELS: RATIONALE & FIELD WATCH-OUT (WHITE FONT APPLE CARDS) */}
        {(whyText || tipText) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* SUB-PANEL 1: OPERATIONAL RATIONALE (WHY IT MATTERS) */}
            {whyText && (
              <div className="p-4 rounded-2xl bg-[#0B0F19] backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                      WHY IT MATTERS
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300">Risk Prevention</span>
                </div>

                <p className="text-xs sm:text-sm font-normal text-white leading-relaxed pl-0.5">
                  {whyText}
                </p>
              </div>
            )}

            {/* SUB-PANEL 2: FIELD WATCH-OUT */}
            {tipText && (
              <div className="p-4 rounded-2xl bg-[#0B0F19] backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-2.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Lightbulb size={16} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
                      FIELD WATCH-OUT
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300">Practical Tip</span>
                </div>

                <p className="text-xs sm:text-sm font-normal text-white leading-relaxed pl-0.5">
                  {tipText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* EXTRA DECISION / CONDITION ITEMS */}
        {extraItems.map((item, index) => {
          if (item.includes('→')) {
            const [situation, action] = item.split('→').map((s) => s.trim());
            return (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)] flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[9px] font-black uppercase tracking-wider">
                    DECISION TRIGGER
                  </span>
                  <span className="text-xs font-bold text-slate-100">{situation}</span>
                </div>
                {action && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-cyan-500/20 text-xs font-semibold text-emerald-300 pl-8">
                    <ArrowRight size={14} className="shrink-0 text-emerald-400" />
                    <span>Directive: {action}</span>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};


