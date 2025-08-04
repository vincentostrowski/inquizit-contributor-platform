import React from 'react';
import { findNodeById } from '../../../utils/treeUtils';

const ContentDrawerHeader = ({ selectedSection, onUpdateSection, sections }) => {
  const handleToggleDone = async () => {
    if (!selectedSection || !onUpdateSection) return;

    const newDoneValue = !selectedSection.sources_done;
    await onUpdateSection(selectedSection.id, { sources_done: newDoneValue });
  };

  const isDone = selectedSection?.sources_done || false;
  
  // Find the section with children from the tree
  const sectionWithChildren = selectedSection && sections.length > 0 
    ? findNodeById(sections, selectedSection.id) 
    : null;
  
  // Check if all children are done (only for sections with children)
  // Only calculate if sections data is properly loaded
  const canBeMarkedDone = sections.length > 0 && (!sectionWithChildren?.children || sectionWithChildren.children.length === 0 || 
    sectionWithChildren.children.every(child => child.sources_done));

  // Force re-calculation when sections or selectedSection changes
  React.useEffect(() => {
    // This effect ensures the component re-renders when sections data is updated
  }, [sections, selectedSection, sectionWithChildren, canBeMarkedDone]);

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {selectedSection?.title}
          </h1>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleToggleDone}
            disabled={!isDone && !canBeMarkedDone}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDone
                ? 'text-gray-500 hover:text-blue-700'
                : canBeMarkedDone
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'text-gray-500'
            }`}
          >
            {isDone ? 'Edit' : (canBeMarkedDone ? 'Done' : 'Complete all subsections')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentDrawerHeader; 