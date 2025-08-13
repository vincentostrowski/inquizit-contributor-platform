import React from 'react';
import SectionCard from './SectionCard';

const CardsList = ({ sections, onSectionClick, onCardClick }) => {
  return (
    <div className="pl-4 pb-6 space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="space-y-3">
          {/* Section Header */}
          <div className="space-y-1 px-1">
            <h3 className="text-xs font-normal text-gray-900">
              {section.title}
            </h3>
          </div>
          
          {/* Cards Row - Horizontal Scroll */}
          <div className="overflow-x-auto">
            <div className="flex gap-3 pb-2">
              {section.cards.map((card) => (
                <SectionCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  coverURL={card.coverURL}
                  onClick={() => onCardClick ? onCardClick(card.id) : onSectionClick(section.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardsList;
