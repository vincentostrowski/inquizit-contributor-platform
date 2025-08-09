import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import NotesSection from './NotesSection';

const ContentDrawerBody = ({ selectedSection, sections, onCharacterCountChange }) => {
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  // Reset selectedSnippet when section changes
  useEffect(() => {
    setSelectedSnippet(null);
  }, [selectedSection?.id]);

  const handleSnippetSelect = (snippet) => {
    setSelectedSnippet(snippet);
  };

  return (
    <div className="flex-1 p-4">
      <div className="h-full flex flex-col">
        {/* Fixed height TextEditor */}
        <div className="h-96 mb-4">
          <TextEditor 
            section={selectedSection} 
            selectedSnippet={selectedSnippet}
            onSnippetSelect={handleSnippetSelect}
          />
        </div>
        
        {/* Scrollable sections container */}
        <div className="flex-1 overflow-y-auto">
          <NotesSection 
            section={selectedSection} 
            selectedSnippet={selectedSnippet}
            onSnippetSelect={handleSnippetSelect}
            onCharacterCountChange={onCharacterCountChange}
          />
          {/* Subsections removed as per request */}
        </div>
      </div>
    </div>
  );
};

export default ContentDrawerBody; 