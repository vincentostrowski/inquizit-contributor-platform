import React, { useState, useEffect } from 'react';
import ReadOnlySection from './ReadOnlySection';
import { useSections } from '../../hooks/useSections';

const ReadOnlySectionBrowser = ({ onSectionSelect, selectedSection, book }) => {
  const { 
    sections, 
    loading, 
    error
  } = useSections(book);

  if (loading) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading sections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-2">
          {sections.map((section) => {
            const isSelectable = section.sources_done && section.completion?.percentage === 100;
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