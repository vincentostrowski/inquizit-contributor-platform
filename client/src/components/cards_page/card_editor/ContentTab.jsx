import React, { useState } from 'react';

const ContentTab = ({ formData, handleInputChange, handleGenerate, buildContentPrompt }) => {
  const [contentCopied, setContentCopied] = useState(false);
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 h-full flex flex-col">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => {
              const prompt = buildContentPrompt();
              navigator.clipboard.writeText(prompt);
              setContentCopied(true);
              setTimeout(() => setContentCopied(false), 3000);
            }}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <span>Prompt</span>
            {contentCopied ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
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