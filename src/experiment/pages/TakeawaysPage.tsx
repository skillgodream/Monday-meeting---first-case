import React from 'react';
import { Slide } from '../types';
import { Text, Panel, Row, SopHeader } from '../tokens';

export const TakeawaysPage: React.FC<{
  slide: Slide;
  onNext?: () => void;
}> = ({ slide }) => {
  let items = slide.items;
  if (!items || items.length === 0) {
    items = (slide.content || '')
      .split('\n')
      .map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);
  }

  // Ensure content limit of 2-4 items
  const finalItems = items.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Universal SOP Header */}
      <SopHeader tag={slide.tag || 'Key Takeaways'} title={slide.title || 'Summary & Core Principles'} />

      {/* Amber Panel of checklist-style rows */}
      <Panel type="takeaway" className="flex flex-col gap-3 text-left">
        <Text styleName="panel-heading">{slide.title || 'Essential Takeaways'}</Text>
        <div className="flex flex-col gap-2">
          {finalItems.map((item, index) => (
            <Row key={index} isTick={true}>
              {item}
            </Row>
          ))}
        </div>
      </Panel>
    </div>
  );
};

