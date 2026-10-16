import React from 'react';
import { Slide } from '../types';
import { Panel, ImageSlot, SopHeader } from '../tokens';
import { AlertTriangle } from 'lucide-react';

export const ImportantRulePage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  let why =
    slide.why ||
    slide.gurujiCoaching?.whyItMatters ||
    'Mandatory procedure requirement. Adhere strictly to verified operational standards.';

  if (slide.title && why.trim().toLowerCase() === slide.title.trim().toLowerCase()) {
    why = 'Non-negotiable operational standard: skipping this verification leads to procedural errors and compliance discrepancies.';
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Universal SOP Header using dynamic title */}
      <SopHeader tag={slide.tag || 'Critical Rule'} title={slide.title || 'Operational Control'} />

      {/* Visual media slot if available */}
      {slide.img && <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />}

      {/* Content block: High-Visibility Red Alert Panel */}
      <Panel type="dont" className="flex flex-col gap-3.5 p-5 rounded-2xl bg-gradient-to-br from-rose-950/80 via-red-950/70 to-rose-900/50 border border-rose-500/60 shadow-[0_8px_25px_rgba(225,29,72,0.25)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/25 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-rose-300">
            CRITICAL OPERATIONAL RULE
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white leading-snug tracking-tight">
          {slide.title}
        </h3>

        <p className="text-xs sm:text-sm font-medium text-rose-100/95 leading-relaxed">
          {why}
        </p>
      </Panel>
    </div>
  );
};

