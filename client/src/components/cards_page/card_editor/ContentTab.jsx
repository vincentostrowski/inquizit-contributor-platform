import React, { useState } from 'react';

const ContentTab = ({ formData, handleInputChange, handleGenerate, buildContentPrompt, fieldCompletion, onFieldCompletionToggle }) => {
  const [contentCopied, setContentCopied] = useState(false);
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">Content</h3>
            
            {/* Completion toggle */}
            <button
              onClick={() => onFieldCompletionToggle && onFieldCompletionToggle('content', !fieldCompletion?.content)}
              className={`w-4 h-4 rounded border-2 transition-colors ${
                fieldCompletion?.content 
                  ? 'bg-green-500 border-green-500' 
                  : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
              title={fieldCompletion?.content ? 'Mark content as incomplete' : 'Mark content as complete'}
            >
              {fieldCompletion?.content && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Prompt button */}
            <button
              onClick={() => {
                const prompt = buildContentPrompt();
                navigator.clipboard.writeText(prompt);
                setContentCopied(true);
                setTimeout(() => setContentCopied(false), 3000);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
              title="Copy prompt to clipboard"
            >
              {contentCopied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span className="text-xs">Prompt</span>
            </button>
        </div>
        <textarea
          value={formData.content || ''}
          onChange={(e) => handleInputChange('content', e.target.value)}
          className="flex-1 w-full p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter the main content for this card..."
        />
      </div>
    </div>
  );
};

export default ContentTab; 