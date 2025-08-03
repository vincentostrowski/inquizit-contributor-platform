import React from 'react';
import ContentDrawerBody from './ContentDrawer/ContentDrawerBody';
import ContentDrawerHeader from './ContentDrawer/ContentDrawerHeader';

const ContentDrawer = ({ selectedSection, onUpdateSection }) => {
  return (
    <div className="h-full bg-white flex flex-col">
      <ContentDrawerHeader 
        selectedSection={selectedSection} 
        onUpdateSection={onUpdateSection}
      />
      <ContentDrawerBody selectedSection={selectedSection} />
    </div>
  );
};

export default ContentDrawer; 