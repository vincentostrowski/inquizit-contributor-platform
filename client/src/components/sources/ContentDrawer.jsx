import React from 'react';
import ContentDrawerBody from './ContentDrawer/ContentDrawerBody';
import ContentDrawerHeader from './ContentDrawer/ContentDrawerHeader';

const ContentDrawer = ({ selectedSection, onUpdateSection, sections }) => {
  return (
    <div className="h-full bg-white flex flex-col">
      <ContentDrawerHeader 
        selectedSection={selectedSection} 
        onUpdateSection={onUpdateSection}
        sections={sections}
      />
      <ContentDrawerBody selectedSection={selectedSection} />
    </div>
  );
};

export default ContentDrawer; 