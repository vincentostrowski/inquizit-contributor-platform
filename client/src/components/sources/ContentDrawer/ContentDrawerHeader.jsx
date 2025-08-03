import React from 'react';

const ContentDrawerHeader = ({ selectedSection, onUpdateSection }) => {
  const handleToggleDone = async () => {
    if (!selectedSection || !onUpdateSection) return;

    const newDoneValue = !selectedSection.done;
    await onUpdateSection(selectedSection.id, { done: newDoneValue });
  };

  const isDone = selectedSection?.done || false;

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
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isDone ? 'Edit' : 'Mark as Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentDrawerHeader; 