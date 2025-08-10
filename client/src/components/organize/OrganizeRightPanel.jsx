import React, { useState, useEffect } from 'react';
import Card from '../cards_page/Card';
import OrganizeGenerateModal from './OrganizeGenerateModal';
import { useCardSections } from '../../hooks/useCardSections';
import { useBook } from '../../context/BookContext';

const OrganizeRightPanel = ({ sections, onCardDrop }) => {
  const { currentBook } = useBook();
  const { 
    cardSections, 
    loading, 
    error, 
    createCardSection, 
    updateCardSection, 
    deleteCardSection 
  } = useCardSections(currentBook);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [bookCards, setBookCards] = useState([]);
  const [draggedCards, setDraggedCards] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  
  // Local state for tracking changes
  const [localSections, setLocalSections] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deletedSections, setDeletedSections] = useState(new Set());

  // Initialize local sections when cardSections changes
  useEffect(() => {
    if (cardSections && cardSections.length > 0) {
      setLocalSections([...cardSections]);
      // Show details for all sections by default
      setExpandedSections(new Set(cardSections.map(section => section.id)));
    }
  }, [cardSections]);

  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const updateLocalSection = (sectionId, updates) => {
    setLocalSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates }
          : section
      )
    );
    markAsChanged();
  };

  const deleteLocalSection = (sectionId) => {
    setDeletedSections(prev => new Set([...prev, sectionId]));
    setLocalSections(prev => prev.filter(section => section.id !== sectionId));
    markAsChanged();
  };

  const addLocalSection = (newSection) => {
    setLocalSections(prev => [...prev, newSection]);
    // Automatically expand the new section
    setExpandedSections(prev => new Set([...prev, newSection.id]));
    markAsChanged();
  };

  const handleSave = async () => {
    try {
      // Process deletions first
      for (const sectionId of deletedSections) {
        await deleteCardSection(sectionId);
      }

      // Process updates and creations
      for (const section of localSections) {
        if (section.id.startsWith('temp-')) {
          // This is a new section, create it
          await createCardSection(section.title);
        } else if (deletedSections.has(section.id)) {
          // Skip deleted sections
          continue;
        } else {
          // This is an existing section, check if it needs updating
          const originalSection = cardSections.find(s => s.id === section.id);
          if (originalSection) {
            const hasChanges = 
              originalSection.title !== section.title ||
              originalSection.description !== section.description;
            
            if (hasChanges) {
              await updateCardSection(section.id, {
                title: section.title,
                description: section.description
              });
            }
          }
        }
      }

      // Reset local state
      setDeletedSections(new Set());
      setHasUnsavedChanges(false);
      
      // Refresh the component to get updated data from parent
      // This will trigger the useEffect and reset localSections
      
    } catch (error) {
      console.error('Error saving changes:', error);
      // You could show an error message to the user here
    }
  };

  const handleCancel = () => {
    // Reset local state back to original
    setLocalSections([...cardSections]);
    setDeletedSections(new Set());
    setHasUnsavedChanges(false);
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

  const handleCreateCategory = async () => {
    const newSection = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      title: `New Section ${localSections.length + 1}`,
      description: '',
      cards: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    addLocalSection(newSection);
  };

  const handleGenerate = () => {
    // Collect all cards from the book's sections
    const allBookCards = sections.flatMap(section => 
      section.cards?.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        card_idea: card.card_idea
      })) || []
    );
    
    setBookCards(allBookCards);
    setShowGenerateModal(true);
  };

  const handleProcessAIResponse = async (aiResponse) => {
    try {
      console.log('Processing AI response:', aiResponse);
      
      // Here you would process the AI response to create new categories
      // For now, we'll just log it and close the modal
      
      setShowGenerateModal(false);
      // TODO: Implement category creation from AI response
      
    } catch (error) {
      console.error('Error processing AI response:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    deleteLocalSection(categoryId);
  };

  const handleCardDrop = (categoryId, card) => {
    // Add the card to the specified category
    // This will need to be updated to actually save to the database
    console.log('Card dropped:', card, 'into section:', categoryId);
    
    // Notify parent component if callback provided
    if (onCardDrop) {
      onCardDrop(categoryId, card);
    }
  };

  const handleDescriptionChange = async (sectionId, newDescription) => {
    updateLocalSection(sectionId, { description: newDescription });
  };

  // Show error if there's one
  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-800">Final Sections</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12 text-red-400">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-lg font-medium mb-2">Error loading sections</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Functional Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800 leading-none">Final Sections</h2>
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGenerate}
              className="px-3 py-1 rounded text-sm transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            >
              Generate
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={handleCancel}
                className="px-3 py-1 rounded text-sm transition-colors border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              >
                Revert
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Cards Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-lg font-medium mb-2">Loading sections...</p>
          </div>
        ) : localSections.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">No sections yet</p>
            <p className="text-sm">Create a section and drag cards from the left to start organizing</p>
          </div>
        ) : (
          <div className="space-y-8">
            {localSections.map((category) => (
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
                          console.log('Description changed:', e.target.value);
                        }}
                      />
                    </div>
                  )}
                  
                  {category.cards.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4">
                      {category.cards.map((card) => (
                        <Card 
                          key={card.id} 
                          card={card} 
                          onClick={() => {}} // No click handler for now
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 mx-4">
                      <div className="text-2xl mb-2">📋</div>
                      <p className="font-medium mb-1">No cards yet</p>
                      <p className="text-sm">Drag cards from the left panel to organize them here</p>
                    </div>
                  )}
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
