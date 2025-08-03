import React, { useState } from 'react';

const ReadOnlySection = ({ section, selectedSectionId, onSelect, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(selectedSectionId === section.id);
  const hasChildren = section.children && section.children.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    onSelect(section);
    // Auto-expand when selecting a section that has children
    if (hasChildren && !isExpanded) {
      setTimeout(() => {
        setIsExpanded(true);
      }, 50);
    }
  };

  const getIndentClass = (level) => {
    if (level === 0) return '';
    if (level === 1) return 'ml-4';
    if (level === 2) return 'ml-8';
    if (level === 3) return 'ml-12';
    if (level === 4) return 'ml-16';
    return `ml-[${level * 16}px]`;
  };

  return (
    <div className="w-full">
      {/* Section Button */}
      <div
        className={`
          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
          ${selectedSectionId === section.id
            ? 'bg-blue-100 border border-blue-300' 
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
          }
          ${getIndentClass(level)}
        `}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-300 rounded transition-colors flex-shrink-0"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="w-6 h-6 flex-shrink-0"></div>
          )}
          
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {section.done && (
              <div className="w-4 h-4 flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <span className="font-medium text-gray-800 truncate flex-1">{section.title}</span>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {section.children.map((child) => (
            <ReadOnlySection
              key={child.id}
              section={child}
              selectedSectionId={selectedSectionId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadOnlySection; 