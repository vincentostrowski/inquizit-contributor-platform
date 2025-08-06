import React from 'react';

const ContentTab = ({ formData, handleInputChange, handleGenerate }) => {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 h-full flex flex-col">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => handleGenerate('content')}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <span>Generate</span>
            <span className="text-xs">◇</span>
          </button>
        </div>
        <textarea
          value={formData.prompt || ''}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          className="flex-1 w-full p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter the main content for this card..."
        />
      </div>
    </div>
  );
};

export default ContentTab; 