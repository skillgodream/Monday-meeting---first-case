import React from 'react';
import { Slide } from '../types';
import { Text, Pill, Panel, ImageSlot, SopHeader } from '../tokens';

export const ScenarioPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || 'Workplace scenario'} title={slide.title || 'Workplace scenario situation'} />

      {/* 3. Visual */}
      <ImageSlot src={slide.img} alt={slide.title} textContext={slide.title} />

      {/* 4. Content block: Premium Panel with zero filler or prohibited text */}
      <Panel type="default" className="flex flex-col gap-2">
        <Text styleName="body">{slide.content}</Text>
      </Panel>
    </div>
  );
};
