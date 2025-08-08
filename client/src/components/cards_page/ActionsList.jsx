import React, { useState } from 'react';

const ActionsList = ({ onActionSelect, isBlocked = false, cards = [] }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [actionMode, setActionMode] = useState(null);

  const actions = [
    {
      id: 'generate-scratch',
      title: "Generate from Scratch",
      description: "Create entirely new cards based on section content",
      icon: "🔄",
      requiresSelection: false
    },
    {
      id: 'regenerate-selective',
      title: "Regenerate (Keep Some)",
      description: "Keep selected cards, regenerate others",
      icon: "🔄",
      requiresSelection: true
    },
    {
      id: 'merge-cards',
      title: "Merge Cards",
      description: "Combine selected cards into one comprehensive card",
      icon: "🔗",
      requiresSelection: true,
      minSelection: 2
    },
    {
      id: 'embed-cards',
      title: "Embed Cards",
      description: "Insert one card's content into another card",
      icon: "📎",
      requiresSelection: true,
      maxSelection: 2
    },
    {
      id: 'edit-cards',
      title: "Edit Cards",
      description: "Provide a prompt to direct AI editing of selected cards",
      icon: "✏️",
      requiresSelection: true
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
    if (action.requiresSelection) {
      setActionMode(action.id);
    } else {
      if (onActionSelect) {
        onActionSelect(action);
      }
    }
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const executeAction = () => {
    if (selectedCards.length > 0 && actionMode) {
      const action = actions.find(a => a.id === actionMode);
      if (onActionSelect) {
        onActionSelect({
          ...action,
          selectedCardIds: selectedCards
        });
      }
      setActionMode(null);
      setSelectedCards([]);
    }
  };

  const isActionDisabled = (action) => {
    // Only check selection requirements when we're in selection mode
    if (actionMode) {
      if (action.requiresSelection && selectedCards.length === 0) return true;
      if (action.minSelection && selectedCards.length < action.minSelection) return true;
      if (action.maxSelection && selectedCards.length > action.maxSelection) return true;
    }
    return false;
  };

  const cancelSelection = () => {
    setActionMode(null);
    setSelectedCards([]);
  };

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 border-l-0 border-t-0 relative overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Available Actions</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Card Selection Mode */}
        {actionMode && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Select cards for: {actions.find(a => a.id === actionMode)?.title}
              </span>
              <button 
                onClick={cancelSelection}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => toggleCardSelection(card.id)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedCards.includes(card.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm truncate">{card.title}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{card.description}</div>
                </button>
              ))}
            </div>
            
            {/* Action Confirmation */}
            {selectedCards.length > 0 && (
              <button
                onClick={executeAction}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Execute {actions.find(a => a.id === actionMode)?.title}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                isActionDisabled(action)
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl flex-shrink-0">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {action.description}
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