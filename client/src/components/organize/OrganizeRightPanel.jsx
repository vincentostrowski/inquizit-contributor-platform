import React, { useState, useEffect } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Card from '../cards_page/Card';
import OrganizeGenerateModal from './OrganizeGenerateModal';
import { useBook } from '../../context/BookContext';

const OrganizeRightPanel = ({ 
  organizeState, 
  updateOrganizeState, 
  addPendingCardMove,
  addPendingSectionCreation,
  addPendingSectionChange,
  addPendingSectionDeletion,
  loadInitialData,
  handleSave,
  sourceSections,
  removeCardFromSection
}) => {
  const { currentBook } = useBook();
  const { 
    destinationSections, 
    organizedCards,
    pendingSectionCreations,
    pendingSectionChanges,
    pendingSectionDeletions,
    pendingCardMoves
  } = organizeState;

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [bookCards, setBookCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Combine existing sections with pending changes for display
  const displaySections = React.useMemo(() => {
    const combined = [...destinationSections];
    
    // Add pending section creations
    pendingSectionCreations.forEach(pendingSection => {
      if (!combined.find(s => s.id === pendingSection.tempId)) {
        combined.push({
          ...pendingSection,
          id: pendingSection.tempId,
          cards: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
    
    // Apply pending section changes
    pendingSectionChanges.forEach(change => {
      const sectionIndex = combined.findIndex(s => s.id === change.sectionId);
      if (sectionIndex !== -1) {
        combined[sectionIndex] = { ...combined[sectionIndex], ...change.changes };
      }
    });
    
    // Remove deleted sections
    return combined.filter(section => !pendingSectionDeletions.includes(section.id));
  }, [destinationSections, pendingSectionCreations, pendingSectionChanges, pendingSectionDeletions]);

  // Initialize expanded sections when destinationSections changes
  useEffect(() => {
    if (destinationSections && destinationSections.length > 0) {
      // Show details for all sections by default
      setExpandedSections(new Set(destinationSections.map(section => section.id)));
    }
  }, [destinationSections]);

  // Auto-expand newly created sections
  useEffect(() => {
    if (displaySections.length > 0) {
      const newSectionIds = displaySections
        .filter(section => section.id && section.id.toString().startsWith('temp-'))
        .map(section => section.id);
      
      if (newSectionIds.length > 0) {
        setExpandedSections(prev => {
          const newSet = new Set(prev);
          newSectionIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    }
  }, [displaySections]);

  const updateLocalSection = (sectionId, updates) => {
    // Add to pending changes in global state
    addPendingSectionChange(sectionId, updates);
  };

  const deleteLocalSection = (sectionId) => {
    // Add to pending deletions in global state
    addPendingSectionDeletion(sectionId);
    
    // Immediately update UI state to show cards back on the left
    const sectionCards = organizeState.organizedCards[sectionId] || [];
    
    // Move cards back to unorganized state in the UI
    const newUnorganizedCards = { ...organizeState.unorganizedCards };
    const newOrganizedCards = { ...organizeState.organizedCards };
    
    // Remove cards from organized state
    delete newOrganizedCards[sectionId];
    
    // Add cards back to their original source sections
    sectionCards.forEach(card => {
      // Use the card's source_section directly - no complex lookup needed!
      let targetSourceSection = sourceSections.find(s => s.id === card.source_section);
      
      // If we can't find the source section, use the first available one as fallback
      if (!targetSourceSection) {
        targetSourceSection = sourceSections[0];
      }
      
      if (targetSourceSection) {
        if (!newUnorganizedCards[targetSourceSection.id]) {
          newUnorganizedCards[targetSourceSection.id] = [];
        }
        
        // Insert card at its original position based on the 'order' field
        const targetCards = newUnorganizedCards[targetSourceSection.id];
        const originalOrder = card.order || 0;
        
        // Find the correct insertion position
        let insertIndex = targetCards.length; // Default to end
        
        for (let i = 0; i < targetCards.length; i++) {
          if (targetCards[i].order > originalOrder) {
            insertIndex = i;
            break;
          }
        }
        
        // Insert card at the correct position
        targetCards.splice(insertIndex, 0, {
          ...card,
          section: null,
          final_order: null
        });
      }
    });
    
    // Update the state
    updateOrganizeState({
      unorganizedCards: newUnorganizedCards,
      organizedCards: newOrganizedCards
    });
  };

  const addLocalSection = (newSection) => {
    // Add to pending creations in global state
    addPendingSectionCreation(newSection);
    // Automatically expand the new section
    setExpandedSections(prev => new Set([...prev, newSection.tempId || newSection.id]));
  };

  const handleCancel = () => {
    // Reset editing state
    setEditingTitle(null);
    setEditingTitleValue('');
    setExpandedSections(new Set());
  };

  const toggleSectionDescription = (sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const startEditingTitle = (sectionId, currentTitle) => {
    setEditingTitle(sectionId);
    setEditingTitleValue(currentTitle);
  };

  const saveTitle = async (sectionId) => {
    if (editingTitleValue.trim()) {
      updateLocalSection(sectionId, { title: editingTitleValue.trim() });
    }
    setEditingTitle(null);
    setEditingTitleValue('');
  };

  const cancelEditingTitle = () => {
    setEditingTitle(null);
    setEditingTitleValue('');
  };

  const handleTitleKeyDown = (e, sectionId) => {
    if (e.key === 'Enter') {
      saveTitle(sectionId);
    } else if (e.key === 'Escape') {
      cancelEditingTitle();
    }
  };

  const handleCreateCategory = () => {
    const newSection = {
      title: `New Section ${displaySections.length + 1}`,
      description: ''
    };
    
    addPendingSectionCreation(newSection);
  };

  const handleGenerate = () => {
    // Collect all cards from both unorganized and organized states
    const unorganizedCards = Object.values(organizeState.unorganizedCards).flat();
    const organizedCards = Object.values(organizeState.organizedCards).flat();
    
    // Combine all cards for the book
    const allBookCards = [...unorganizedCards, ...organizedCards].map(card => ({
      id: card.id,
      title: card.title,
      description: card.description,
      card_idea: card.card_idea
    }));
    
    setBookCards(allBookCards);
    setShowGenerateModal(true);
  };

  const handleProcessAIResponse = async (aiResponse) => {
    try {
      setProcessing(true);
      
      // Phase 1: Basic Response Parsing & Validation
      
      // Validate the AI response structure
      if (!aiResponse.sections || !Array.isArray(aiResponse.sections)) {
        throw new Error('Invalid AI response: missing or invalid sections array');
      }
      
      if (aiResponse.sections.length === 0) {
        throw new Error('AI response contains no sections');
      }
      
      // Validate each section structure
      for (const section of aiResponse.sections) {
        if (!section.title || typeof section.title !== 'string') {
          throw new Error('Each section must have a valid title');
        }
        
        if (!section.cardIds || !Array.isArray(section.cardIds)) {
          throw new Error(`Section "${section.title}" must have a cardIds array`);
        }
        
        if (section.cardIds.length === 0) {
          console.warn(`Section "${section.title}" has no cards assigned`);
        }
        
        // Validate card IDs are strings or numbers
        for (const cardId of section.cardIds) {
          if (cardId === null || cardId === undefined) {
            throw new Error(`Section "${section.title}" contains invalid card ID: ${cardId}`);
          }
        }
      }
      
      // Phase 2: Section Creation
      const createdSections = [];
      
      // Create new sections based on AI response
      for (const aiSection of aiResponse.sections) {
        const newSection = {
          title: aiSection.title,
          description: aiSection.description || ''
        };
        
        // Create the section and get its temporary ID
        const tempId = addPendingSectionCreation(newSection);
        
        createdSections.push({
          tempId,
          title: aiSection.title,
          cardIds: aiSection.cardIds
        });
      }
      
      // Phase 3: Card Organization
      let totalCardsMoved = 0;
      
      // Collect all changes first, then update state once
      const newUnorganizedCards = { ...organizeState.unorganizedCards };
      const newOrganizedCards = { ...organizeState.organizedCards };
      
      // Process each section's card assignments
      for (const createdSection of createdSections) {
        const { tempId, cardIds } = createdSection;
        
        // Move each card to the new section
        for (const cardId of cardIds) {
          try {
            // Find the card in unorganized state
            let foundCard = null;
            let sourceSectionId = null;
            
            // Search through all unorganized cards
            for (const [sectionId, cards] of Object.entries(organizeState.unorganizedCards)) {
              const card = cards.find(c => c.id.toString() === cardId.toString());
              if (card) {
                foundCard = card;
                sourceSectionId = sectionId;
                break;
              }
            }
            
            if (!foundCard) {
              console.warn(`Card ${cardId} not found in unorganized state`);
              continue;
            }
            
            // Add card move to pending changes
            addPendingCardMove({
              type: 'left_to_right',
              cardId: foundCard.id,
              fromSectionId: parseInt(sourceSectionId),
              toSectionId: tempId,
              dropIndex: 0, // Will be updated with actual position
              originalSourceSectionId: parseInt(sourceSectionId)
            });
            
            // Remove card from unorganized state
            newUnorganizedCards[sourceSectionId] = newUnorganizedCards[sourceSectionId].filter(c => c.id !== foundCard.id);
            
            // Add card to organized state
            if (!newOrganizedCards[tempId]) {
              newOrganizedCards[tempId] = [];
            }
            
            // Add card to the new section
            newOrganizedCards[tempId].push({
              ...foundCard,
              section: tempId,
              final_order: newOrganizedCards[tempId].length
            });
            
            totalCardsMoved++;
            
          } catch (error) {
            console.error(`Error moving card ${cardId}:`, error);
          }
        }
      }
      
      // Make one final state update with all accumulated changes
      updateOrganizeState({
        unorganizedCards: newUnorganizedCards,
        organizedCards: newOrganizedCards
      });
      
      // Close modal and show success
      setShowGenerateModal(false);
      
    } catch (error) {
      console.error('Error processing AI response:', error);
      alert(`Error processing AI response: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    deleteLocalSection(categoryId);
  };

  const handleCardDrop = (categoryId, card) => {
    // Add the card to the specified category
    // This will need to be updated to actually save to the database
    
    // Notify parent component if callback provided
    if (onCardDrop) {
      onCardDrop(categoryId, card);
    }
  };

  const handleDescriptionChange = async (sectionId, newDescription) => {
    updateLocalSection(sectionId, { description: newDescription });
  };

  // No error handling needed - errors are handled in the parent component

  return (
    <div className="h-full flex flex-col">
      {/* Top Functional Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800 leading-none">Final Sections</h2>
            {(pendingCardMoves.length > 0 || 
              pendingSectionCreations.length > 0 || 
              pendingSectionChanges.length > 0 || 
              pendingSectionDeletions.length > 0) && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
            {organizeState.saveError && (
              <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded-full">
                Save failed: {organizeState.saveError}
              </span>
            )}
          </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerate}
                disabled={processing}
                className="px-3 py-1 rounded text-sm transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Loading...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
              {(pendingCardMoves.length > 0 || 
                pendingSectionCreations.length > 0 || 
                pendingSectionChanges.length > 0 || 
                pendingSectionDeletions.length > 0) && (
                <button
                  onClick={() => {
                    // Reset all pending changes
                    updateOrganizeState({
                      pendingCardMoves: [],
                      pendingSectionCreations: [],
                      pendingSectionChanges: [],
                      pendingSectionDeletions: [],
                      // Reset card positions to original state
                      unorganizedCards: {}, // Will be refetched
                      organizedCards: {}    // Will be refetched
                    });
                    // Reload data
                    loadInitialData();
                  }}
                  className="px-3 py-1 rounded text-sm transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                >
                  Revert
                </button>
              )}
              <button 
                onClick={handleSave}
                disabled={organizeState.isSaving || !(pendingCardMoves.length > 0 || 
                  pendingSectionCreations.length > 0 || 
                  pendingSectionChanges.length > 0 || 
                  pendingSectionDeletions.length > 0)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  (pendingCardMoves.length > 0 || 
                   pendingSectionCreations.length > 0 || 
                   pendingSectionChanges.length > 0 || 
                   pendingSectionDeletions.length > 0)
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {organizeState.isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
        </div>
      </div>

      {/* Bottom Cards Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {displaySections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">No sections yet</p>
            <p className="text-sm">Create a section and drag cards from the left to start organizing</p>
          </div>
        ) : (
          <div className="space-y-8">
            {displaySections.map((category) => (
              <div key={category.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Category Header - White background */}
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {editingTitle === category.id ? (
                      <input
                        type="text"
                        value={editingTitleValue}
                        onChange={(e) => setEditingTitleValue(e.target.value)}
                        onBlur={() => saveTitle(category.id)}
                        onKeyDown={(e) => handleTitleKeyDown(e, category.id)}
                        className="text-lg font-medium text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-1 py-1"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors px-1 py-1 rounded hover:bg-blue-50"
                        onClick={() => startEditingTitle(category.id, category.title)}
                        title="Click to edit title"
                      >
                        {category.title}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSectionDescription(category.id)}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-gray-100"
                    >
                      {expandedSections.has(category.id) ? 'Hide' : 'Show'} Details
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Cards Area - Gray background */}
                <div className="py-4">
                  {/* Section Description Toggle */}
                  {expandedSections.has(category.id) && (
                    <div className="mb-4 px-4">
                      <textarea
                        placeholder={`Write the description for ${category.title}...`}
                        className="w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none resize-none"
                        rows={3}
                        defaultValue={category.description || ''}
                        onBlur={(e) => {
                          handleDescriptionChange(category.id, e.target.value);
                        }}
                        onChange={(e) => {
                          // Update local state immediately for responsive UI
                          // The actual save happens on blur
                        }}
                      />
                    </div>
                  )}
                  
                  <Droppable 
                    droppableId={`right-section-${category.id}`}
                    direction="horizontal"
                    isDropDisabled={false}
                    isCombineEnabled={false}
                    ignoreContainerClipping={false}
                  >
                    {(provided, snapshot) => {
                      const sectionCards = organizedCards[category.id] || [];
                      return (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4 min-h-[200px]"
                        >
                          {sectionCards.length > 0 ? (
                            <>
                              {sectionCards.map((card, index) => (
                                <Card 
                                  key={card.id} 
                                  card={card} 
                                  onClick={() => {}} // No click handler for now
                                  index={index}  // NEW: Make cards draggable within their section
                                  showRemoveButton={true}  // Show remove button for organized cards
                                  onRemove={removeCardFromSection}  // Call remove function
                                  sectionId={category.id}  // Pass section ID for removal
                                />
                              ))}
                            </>
                          ) : (
                            <div className="text-center py-8 text-gray-400 mx-4 w-full">
                              <div className="text-2xl mb-2">📋</div>
                              <p className="text-sm">No cards yet</p>
                              <p className="text-sm">Drag cards from the left panel to organize them here</p>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      );
                    }}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Bottom Create Section Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCreateCategory}
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span>
            <span>Create Section</span>
          </button>
        </div>
      </div>

      {/* Generate Modal */}
      <OrganizeGenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        bookCards={bookCards}
        onProcessResponse={handleProcessAIResponse}
      />
    </div>
  );
};

export default OrganizeRightPanel;
