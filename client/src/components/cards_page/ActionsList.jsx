import React, { useState } from 'react';

const ActionsList = ({ onActionSelect, isBlocked = false, cards = [], generating = false, onGenerate, onConfirm, canConfirm = false, isConfirmed = false }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const actions = [
    {
      id: 'generate-scratch',
      title: "Generate from Scratch",
      description: "Create entirely new cards based on section content",
      icon: "🔄",
      requiresSelection: false
    },
    {
      id: 'copy-json',
      title: "Copy Cards JSON",
      description: "Copy all cards data as JSON to clipboard",
      icon: "📋",
      requiresSelection: false
    },
    {
      id: 'delete-all',
      title: "Delete All Cards",
      description: "Remove all cards for this section",
      icon: "🗑️",
      requiresSelection: false
    }
  ];

  const handleActionClick = (action) => {
    if (action.id === 'generate-scratch' && onGenerate) {
      onGenerate();
      return;
    }
    
    if (action.id === 'copy-json') {
      const cardsJson = JSON.stringify(cards, null, 2);
      navigator.clipboard.writeText(cardsJson).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Hide after 2 seconds
        console.log('Cards JSON copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
      });
      return;
    }
    
    if (onActionSelect) {
      onActionSelect(action);
    }
  };



  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 border-l-0 border-t-0 relative overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Available Actions</h3>
          {cards.length > 0 && canConfirm && (
            <button
              onClick={onConfirm}
              disabled={isConfirmed}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isConfirmed
                  ? 'text-gray-500 hover:text-blue-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isConfirmed ? 'Edit' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Action Buttons */}
        <div className="space-y-3">
          {actions
            .filter(action => cards.length === 0 ? action.id === 'generate-scratch' : true)
            .map((action) => (
            <div
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                action.id === 'generate-scratch' && generating
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                  : action.id === 'copy-json' && copySuccess
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {action.id === 'generate-scratch' && generating ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  ) : action.id === 'copy-json' && copySuccess ? (
                    '✅'
                  ) : (
                    action.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {action.id === 'generate-scratch' && generating ? 'Generating...' : 
                     action.id === 'copy-json' && copySuccess ? 'Copied!' : 
                     action.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {action.id === 'copy-json' && copySuccess ? 'JSON copied to clipboard' : action.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Simple overlay when blocked */}
      {isBlocked && (
        <div className="absolute inset-0 bg-white opacity-75 z-10">
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 text-lg font-bold">Complete all subsections first</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionsList; 