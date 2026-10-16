import React from 'react';
import { Slide } from '../types';
import { Panel, Row, SopHeader } from '../tokens';
import { CheckCircle2, XCircle } from 'lucide-react';

export const DoDontPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  const dos = slide.dos || slide.comparison?.do || [];
  const donts = slide.donts || slide.comparison?.dont || [];

  // Content limit of 2-4 items each
  const finalDos = dos.slice(0, 4);
  const finalDonts = donts.slice(0, 4);

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || "Do and don't"} title={slide.title || "Do and don't guidelines"} />

      {/* 3. Content block: Side-by-side or stacked Do and Don't Panels */}
      <div className="flex flex-col gap-4">
        {finalDos.length > 0 && (
          <Panel type="do" className="flex flex-col gap-3 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50">
            <div className="flex items-center gap-2 text-emerald-300 font-black text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-extrabold">Do</span>
            </div>
            <div className="flex flex-col gap-2">
              {finalDos.map((item, index) => (
                <Row key={index} isTick={true}>
                  {item}
                </Row>
              ))}
            </div>
          </Panel>
        )}

        {finalDonts.length > 0 && (
          <Panel type="dont" className="flex flex-col gap-3 p-4 rounded-2xl bg-rose-950/70 border border-rose-500/60 shadow-lg">
            <div className="flex items-center gap-2 text-rose-300 font-black text-lg">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span className="text-white font-extrabold">Don't</span>
            </div>
            <div className="flex flex-col gap-2">
              {finalDonts.map((item, index) => (
                <Row key={index} isCross={true}>
                  {item}
                </Row>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
};
