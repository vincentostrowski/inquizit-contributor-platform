import React, { useState, useEffect } from 'react';

const PromptModal = ({ isOpen, onClose, promptData, onProcessResponse }) => {
  const [currentBatch, setCurrentBatch] = useState(0);
  const [claudeResponse, setClaudeResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClaudeResponse('');
      setCurrentBatch(0);
      setProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || !promptData) return null;

  const { 
    sectionTitle = '', 
    totalSnippets = 0, 
    totalCharacters = 0, 
    batches = [], 
    estimatedCost = '' 
  } = promptData;

  const handleProcessResponse = async () => {
    if (!claudeResponse.trim()) {
      alert('Please paste the Claude response first');
      return;
    }

    setProcessing(true);
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(claudeResponse);
      await onProcessResponse(parsedResponse);
    } catch (error) {
      alert('Invalid JSON response. Please check the format.');
      console.error('Error parsing Claude response:', error);
    } finally {
      setProcessing(false);
    }
  };

  const copyPromptToClipboard = () => {
    const currentPrompt = batches[currentBatch]?.prompt;
    if (currentPrompt) {
      navigator.clipboard.writeText(currentPrompt);
      alert('Prompt copied to clipboard!');
    } else {
      alert('No prompt available to copy');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 h-5/6 max-w-6xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate Cards with AI</h2>
            <p className="text-sm text-gray-600 mt-1">
              {sectionTitle} • {totalSnippets} snippets • {totalCharacters.toLocaleString()} characters
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left side - Prompt */}
          <div className="w-1/2 p-6 border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">AI Prompt</h3>
              <div className="flex items-center space-x-2">
                {batches && batches.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentBatch(Math.max(0, currentBatch - 1))}
                      disabled={currentBatch === 0}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentBatch + 1} of {batches.length}
                    </span>
                    <button
                      onClick={() => setCurrentBatch(Math.min(batches.length - 1, currentBatch + 1))}
                      disabled={currentBatch === batches.length - 1}
                      className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                )}
                <button
                  onClick={copyPromptToClipboard}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50 rounded-lg p-4 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {batches[currentBatch]?.prompt || 'Loading prompt...'}
              </pre>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Character count: {batches[currentBatch]?.characterCount?.toLocaleString() || '0'}
            </div>
          </div>

          {/* Right side - Response */}
          <div className="w-1/2 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Paste AI Response</h3>
            </div>
            
            <div className="flex-1 flex flex-col">
              <textarea
                value={claudeResponse}
                onChange={(e) => setClaudeResponse(e.target.value)}
                placeholder="Paste the JSON response from your AI assistant here..."
                className="flex-1 w-full p-4 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              
              <div className="mt-4 text-xs text-gray-500">
                Make sure the response is valid JSON with the expected format (Claude, GPT, etc.)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-600">
            {batches && batches.length > 1 && (
              <span>
                Processing batch {currentBatch + 1} of {batches.length}. 
                {currentBatch < batches.length - 1 && ' You can process multiple batches by pasting responses for each.'}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessResponse}
              disabled={processing || !claudeResponse.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Process Response'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal; 