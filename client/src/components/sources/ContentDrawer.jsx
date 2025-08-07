import React, { useState } from 'react';
import ContentDrawerBody from './ContentDrawer/ContentDrawerBody';
import ContentDrawerHeader from './ContentDrawer/ContentDrawerHeader';

const ContentDrawer = ({ selectedSection, onUpdateSection, sections }) => {
  const [characterCount, setCharacterCount] = useState(0);

  return (
    <div className="h-full bg-white flex flex-col">
      <ContentDrawerHeader 
        selectedSection={selectedSection} 
        onUpdateSection={onUpdateSection}
        sections={sections}
        characterCount={characterCount}
      />
      <ContentDrawerBody 
        selectedSection={selectedSection} 
        sections={sections}
        onCharacterCountChange={setCharacterCount}
      />
    </div>
  );
};

export default ContentDrawer; 