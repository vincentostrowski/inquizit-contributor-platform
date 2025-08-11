import React, { useState, useEffect } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { supabase } from '../../services/supabaseClient';
import Card from '../cards_page/Card';

const OrganizeLeftPanel = ({ organizeState, updateOrganizeState, addPendingCardMove }) => {
  const { sourceSections, unorganizedCards, draggedCard, draggedCardSection } = organizeState;
  const [loading, setLoading] = useState(true);

    // Drag handlers
  const handleDragStart = (card, sectionId) => {
    updateOrganizeState({
      draggedCard: card,
      draggedCardSection: sectionId
    });
  };

  // Note: handleDragEnd is now handled in the parent OrganizePage component
  // This function is no longer needed here

      // Determine loading state based on data availability
  useEffect(() => {
    if (sourceSections.length > 0 && Object.keys(unorganizedCards).length === 0) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [sourceSections, unorganizedCards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sourceSections || sourceSections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>No sections found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-8">
        {sourceSections.map((section) => {
          const cards = unorganizedCards[section.id] || [];
          // Consider dragged card state - if a card is being dragged from this section, 
          // it's visually removed so we should show the checkmark
          const isDraggingFromThisSection = draggedCard && draggedCardSection === section.id;
          const hasCards = cards.length > 0 && !isDraggingFromThisSection;
          
          return (
            <div key={section.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {/* Section Header - White background with checkmark when empty */}
              <div className={`bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between ${!hasCards ? 'pb-4' : ''}`}>
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                {!hasCards && (
                  <div className="flex items-center">
                    <svg 
                      className="w-6 h-6 text-green-600 animate-pulse" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Cards Area - Only show when there are cards */}
              {hasCards && (
                <div className="py-4">
                  <Droppable 
                    droppableId={`left-section-${section.id}`}
                    direction="horizontal"
                    isDropDisabled={true}
                    isCombineEnabled={false}
                    ignoreContainerClipping={false}
                  >
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4"
                      >
                        {cards.map((card, index) => (
                          <Card 
                            key={card.id} 
                            card={card} 
                            onClick={() => {}} // No click handler for now
                            index={index}  // CRITICAL: This makes the card draggable
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrganizeLeftPanel;
