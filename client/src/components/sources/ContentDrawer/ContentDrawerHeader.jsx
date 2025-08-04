import React from 'react';

const ContentDrawerHeader = ({ selectedSection, onUpdateSection }) => {
  const handleToggleDone = async () => {
    if (!selectedSection || !onUpdateSection) return;

    const newDoneValue = !selectedSection.sources_done;
    await onUpdateSection(selectedSection.id, { sources_done: newDoneValue });
  };

  const isDone = selectedSection?.sources_done || false;

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {selectedSection?.title || 'No section selected'}
          </h1>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleToggleDone}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isDone
                ? 'text-gray-500 hover:text-blue-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isDone ? 'Edit' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentDrawerHeader; 