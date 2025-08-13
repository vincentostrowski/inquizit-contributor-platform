import React from 'react';
import SectionComponent from './SectionComponent';

const SectionsList = ({ sections, onSectionClick }) => {
  return (
    <div className="px-4 pb-6 space-y-3">
      {sections.map((section) => (
        <SectionComponent
          key={section.id}
          title={section.title}
          cardCount={section.cards?.length || 0}
          onClick={() => onSectionClick(section.id)}
        />
      ))}
    </div>
  );
};

export default SectionsList;
