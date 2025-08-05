import React, { useState, useEffect } from 'react';

const Section = ({ section, selectedSectionId, onSelect, onCreateSubsection, onUpdateSection, onDeleteSection, level = 0 }) => {
  // Check if this section should be expanded (either selected or is an ancestor of selected section)
  const isAncestorOfSelected = (section, selectedId) => {
    if (!selectedId || !section.children) return false;
    return section.children.some(child => 
      child.id === selectedId || isAncestorOfSelected(child, selectedId)
    );
  };
  
  const shouldBeExpanded = selectedSectionId === section.id || isAncestorOfSelected(section, selectedSectionId);
  const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);
  
  // Update expansion state when selected section changes (for initial load)
  useEffect(() => {
    // Only auto-expand if this section is NOT the selected section
    // This prevents auto-expansion when a section becomes selected
    if (selectedSectionId !== section.id) {
      setIsExpanded(shouldBeExpanded);
    }
  }, [selectedSectionId, shouldBeExpanded, section.id]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = section.children && section.children.length > 0;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (!isEditing) {
      onSelect(section);
      // Toggle expansion when selecting a section that has children
      if (hasChildren) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  const handleCreateSubsection = (e) => {
    e.stopPropagation();
    if (onCreateSubsection) {
      onCreateSubsection(section);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(section.title);
  };

  const handleEditSave = async () => {
    if (editTitle.trim() !== section.title && onUpdateSection) {
      await onUpdateSection(section.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(section.title);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDeleteSection) {
      onDeleteSection(section);
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
          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group
          ${selectedSectionId === section.id
            ? 'bg-blue-100 border border-blue-300' 
            : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
          }
          ${getIndentClass(level)}
        `}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
              className="font-medium text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 flex-1 min-w-0"
              autoFocus
            />
          ) : (
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="font-medium text-gray-800 truncate flex-1">{section.title}</span>
              {section.sources_done && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                  <span>Sources</span>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hover Actions */}
        {isHovered && !isEditing && (
          <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEditClick}
              className="w-6 h-6 flex items-center justify-center hover:bg-gray-300 rounded transition-colors"
              title="Edit section title"
            >
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="w-6 h-6 flex items-center justify-center hover:bg-red-100 rounded transition-colors"
              title="Delete section"
            >
              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {section.children.map((child) => (
            <Section
              key={child.id}
              section={child}
              selectedSectionId={selectedSectionId}
              onSelect={onSelect}
              onCreateSubsection={onCreateSubsection}
              onUpdateSection={onUpdateSection}
              onDeleteSection={onDeleteSection}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Create Subsection Button - Only show for selected section that is expanded */}
      {selectedSectionId === section.id && (!hasChildren || isExpanded) && (
        <div className="mt-2">
          <button 
            onClick={handleCreateSubsection}
            className={`p-3 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-300 ${getIndentClass(level + 1)}`} 
            style={{ width: `calc(100% - ${(level + 1) * 16}px)` }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium text-blue-600">Create a Subsection</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Section; 