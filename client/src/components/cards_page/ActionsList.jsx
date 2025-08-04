import React from 'react';

// Mock actions data
const mockActions = [
  {
    id: 1,
    title: "Generate completely new set of cards",
    description: "Create a fresh set of cards based on the current section content",
    icon: "🎲",
    category: "generation"
  },
  {
    id: 2,
    title: "Select cards to use in context",
    description: "Choose specific cards to include in the current context",
    icon: "📋",
    category: "selection"
  },
  {
    id: 3,
    title: "Embed cards into another card",
    description: "Combine multiple cards into a single comprehensive card",
    icon: "🔗",
    category: "embedding"
  },
  {
    id: 4,
    title: "Merge cards",
    description: "Combine similar cards to reduce redundancy",
    icon: "🔄",
    category: "merging"
  },
  {
    id: 5,
    title: "Refine existing cards",
    description: "Improve the content and structure of current cards",
    icon: "✏️",
    category: "refinement"
  },
  {
    id: 6,
    title: "Export cards",
    description: "Export cards to various formats for external use",
    icon: "📤",
    category: "export"
  },
  {
    id: 7,
    title: "Analyze card patterns",
    description: "Review patterns and relationships between cards",
    icon: "📊",
    category: "analysis"
  },
  {
    id: 8,
    title: "Create card templates",
    description: "Save current card structure as reusable templates",
    icon: "📝",
    category: "templates"
  }
];

const ActionsList = ({ onActionSelect }) => {
  const handleActionClick = (action) => {
    if (onActionSelect) {
      onActionSelect(action);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Available Actions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mockActions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border border-gray-200"
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
    </div>
  );
};

export default ActionsList; 