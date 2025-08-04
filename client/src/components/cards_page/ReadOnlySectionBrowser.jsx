import React from 'react';
import ReadOnlySection from './ReadOnlySection';

const ReadOnlySectionBrowser = ({ onSectionSelect, selectedSection, book, sections }) => {



  return (
    <div className="h-full bg-white flex flex-col">
      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {sections.map((section) => {
            const isSelectable = section.sources_done;
            return (
              <ReadOnlySection
                key={section.id}
                section={section}
                selectedSectionId={selectedSection?.id}
                onSelect={onSectionSelect}
                isSelectable={isSelectable}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReadOnlySectionBrowser; 