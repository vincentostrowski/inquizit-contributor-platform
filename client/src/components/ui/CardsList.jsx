import React from 'react';
import SectionCard from './views/BookView/SectionCard';

const CardsList = ({ sections, onSectionClick, onCardClick }) => {
  return (
    <div className="pb-6 space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="space-y-3">
          {/* Section Header */}
          <div className="space-y-1 px-1 pl-5">
            <h3 className="text-xs font-normal text-gray-900 cursor-pointer" onClick={() => onSectionClick(section.id)}>
              {section.title}
            </h3>
          </div>
          
          {/* Cards Row - Horizontal Scroll */}
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-3 pb-2 px-4">
              {section.cards.map((card) => (
                <SectionCard
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  coverURL={card.coverURL}
                  onClick={() => onCardClick ? onCardClick(card) : onSectionClick(section.id)}
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
