import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ReadOnlySectionBrowser from '../components/cards_page/ReadOnlySectionBrowser';  
import CardGrid from '../components/cards_page/CardGrid';
import ActionsList from '../components/cards_page/ActionsList';
import PromptModal from '../components/cards_page/PromptModal';
import { CardEditModal } from '../components/cards_page/card_editor';
import { useBook } from '../context/BookContext';
import { useUrlState } from '../hooks/useUrlState';
import { useSections } from '../hooks/useSections';

const CardsPage = () => {
  const { currentBook } = useBook();
  const { sectionId, selectSection } = useUrlState();
  const [selectedSection, setSelectedSection] = useState(null);
  const { sections, updateSection: updateSectionFromHook } = useSections(currentBook);
  
  // Card-related state (moved from CardDrawer)
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sectionDefaultLink, setSectionDefaultLink] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptData, setPromptData] = useState(null);

  // Fetch selected section data when sectionId changes
  useEffect(() => {
    const fetchSection = async () => {
      if (sectionId) {
        const { data, error } = await supabase
          .from('source_sections')
          .select('*')
          .eq('id', sectionId)
          .single();
        
        if (data) {
          setSelectedSection(data);
        } else {
          setSelectedSection(null);
        }
      } else {
        setSelectedSection(null);
      }
    };

    fetchSection();
  }, [sectionId]);

  // Helper functions (moved from CardDrawer)
  const findNodeById = (tree, id) => {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Find the selected section from the processed sections data
  const sectionWithCompletion = selectedSection && sections.length > 0 
    ? findNodeById(sections, selectedSection.id) 
    : null;

  // Check if section is ready for card creation
  const isSectionReady = sectionWithCompletion?.sources_done && sectionWithCompletion?.completion?.percentage === 100;

  // Check if all children are done (only for sections with children)
  const canBeMarkedDone = sections.length > 0 && (!sectionWithCompletion?.children || sectionWithCompletion.children.length === 0 || 
    sectionWithCompletion.children.every(child => child.card_set_done));

  // Get all descendant section IDs (including the selected section)
  const getAllSectionIds = (section) => {
    const ids = [section.id];
    if (section.children && section.children.length > 0) {
      section.children.forEach(child => {
        ids.push(...getAllSectionIds(child));
      });
    }
    return ids;
  };

  // Helper function to fetch cards with conversation links
  const fetchCardsWithLinks = async (sectionIds) => {
    try {
      const { data: cardsData, error } = await supabase
        .from('cards')
        .select(`
          *,
          snippet_chunks_for_context (
            link,
            source_section_id
          )
        `)
        .in('id', (
          await supabase
            .from('snippet_chunks_for_context')
            .select('card_id')
            .in('source_section_id', sectionIds)
        ).data?.map(chunk => chunk.card_id) || []);

      if (error) {
        console.error('Error fetching cards:', error);
        return [];
      }

      return cardsData || [];
    } catch (error) {
      console.error('Error in fetchCardsWithLinks:', error);
      return [];
    }
  };

  // Helper function to fetch section's default conversation link
  const fetchSectionDefaultLink = async (sectionId) => {
    if (!sectionId) {
      setSectionDefaultLink(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('snippet_chunks_for_context')
        .select('link')
        .not('link', 'is', null)
        .eq('source_section_id', sectionId)
        .limit(1);

      if (!error && data && data.length > 0 && data[0]?.link) {
        setSectionDefaultLink(data[0].link);
      } else {
        setSectionDefaultLink(null);
      }
    } catch (error) {
      console.error('Error fetching section default link:', error);
      setSectionDefaultLink(null);
    }
  };

  // Helper function to refresh cards and section default link
  const refreshCardsAndDefaultLink = async () => {
    if (sectionWithCompletion) {
      const sectionIds = getAllSectionIds(sectionWithCompletion);
      const cardsData = await fetchCardsWithLinks(sectionIds);
      setCards(cardsData);
      await fetchSectionDefaultLink(sectionWithCompletion.id);
    }
  };

  // Auto-select first section when no section is in URL and sections are loaded
  useEffect(() => {
    if (!sectionId && sections.length > 0) {
      const firstSection = sections[0];
      handleSectionSelect(firstSection);
    }
  }, [sections]);

  // Fetch cards when sectionWithCompletion changes
  useEffect(() => {
    const fetchCards = async () => {
      if (sectionWithCompletion) {
        setLoading(true);
        try {
          const sectionIds = getAllSectionIds(sectionWithCompletion);
          const cardsData = await fetchCardsWithLinks(sectionIds);
          setCards(cardsData);
          
          // Fetch the section's default conversation link
          await fetchSectionDefaultLink(sectionWithCompletion.id);
        } catch (error) {
          console.error('Error fetching cards:', error);
          setCards([]);
        } finally {
          setLoading(false);
        }
      } else {
        setCards([]);
        setSectionDefaultLink(null);
      }
    };

    fetchCards();
  }, [sectionWithCompletion]);

  // Card-related handlers (moved from CardDrawer)
  const handleCreateCard = () => {
    // Create an empty card object for the modal
    const newCard = {
      title: '',
      description: '',
      prompt: '',
      order: cards.length + 1, // Set order to be after existing cards
      banner: '',
      card_idea: '',
      book: currentBook.id, // Link to current book
      conversationLink: sectionDefaultLink // Use the section's default link if it exists
    };
    setSelectedCard(newCard);
    setIsModalOpen(true);
  };

  const handleCardClick = (card) => {
    // Add the section default link to the card if it doesn't already have a conversation link
    const cardWithDefaultLink = {
      ...card,
      conversationLink: card.conversationLink || sectionDefaultLink
    };
    setSelectedCard(cardWithDefaultLink);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleCardDelete = async (cardId) => {
    try {
      // Delete the card (this will cascade to snippet_chunks_for_context due to foreign key)
      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (deleteError) {
        console.error('Error deleting card:', deleteError);
        return;
      }

      // Refresh cards and section default link
      await refreshCardsAndDefaultLink();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleCardSave = async (updatedCard) => {
    try {
      let cardId;
      
      // Check if this is a new card (no id) or existing card
      if (!selectedCard.id) {
        // Include all valid fields from the cards table schema
        const cardData = {
          title: updatedCard.title || '',
          description: updatedCard.description || '',
          prompt: updatedCard.prompt || '',
          order: updatedCard.order || cards.length + 1,
          banner: updatedCard.banner || '',
          card_idea: updatedCard.card_idea || '',
          book: currentBook.id
        };
        
        // Insert new card
        const { data: newCard, error: insertError } = await supabase
          .from('cards')
          .insert(cardData)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating card:', insertError);
          return;
        }
        
        cardId = newCard.id;
        
        // Create a snippet chunk to link the card to this section
        const { error: chunkError } = await supabase
          .from('snippet_chunks_for_context')
          .insert({
            card_id: cardId,
            source_section_id: sectionWithCompletion.id,
            // No snippet_id for manually created cards
            link: updatedCard.conversationLink || null
          });

        if (chunkError) {
          console.error('Error creating snippet chunk:', chunkError);
          // Optionally delete the card if chunk creation fails
          await supabase.from('cards').delete().eq('id', cardId);
          return;
        }
      } else {
        // Update existing card
        const cardData = {
          title: updatedCard.title || '',
          description: updatedCard.description || '',
          prompt: updatedCard.prompt || '',
          order: updatedCard.order || selectedCard.order,
          banner: updatedCard.banner || '',
          card_idea: updatedCard.card_idea || ''
        };
        
        const { error: updateError } = await supabase
          .from('cards')
          .update(cardData)
          .eq('id', selectedCard.id);

        if (updateError) {
          console.error('Error updating card:', updateError);
          return;
        }
        
        cardId = selectedCard.id;
        
        // Update or create snippet chunk for conversation link
        if (updatedCard.conversationLink !== selectedCard.conversationLink) {
          // First, try to update existing chunk
          const { data: existingChunk, error: findError } = await supabase
            .from('snippet_chunks_for_context')
            .select('id')
            .eq('card_id', cardId)
            .eq('source_section_id', sectionWithCompletion.id)
            .single();

          if (existingChunk) {
            // Update existing chunk
            const { error: updateChunkError } = await supabase
              .from('snippet_chunks_for_context')
              .update({ link: updatedCard.conversationLink || null })
              .eq('id', existingChunk.id);

            if (updateChunkError) {
              console.error('Error updating snippet chunk:', updateChunkError);
            }
          } else {
            // Create new chunk
            const { error: createChunkError } = await supabase
              .from('snippet_chunks_for_context')
              .insert({
                card_id: cardId,
                source_section_id: sectionWithCompletion.id,
                link: updatedCard.conversationLink || null
              });

            if (createChunkError) {
              console.error('Error creating snippet chunk:', createChunkError);
            }
          }
        }
      }

      // Refresh cards and section default link
      await refreshCardsAndDefaultLink();
      
      // Close modal
      setIsModalOpen(false);
      setSelectedCard(null);
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleActionSelect = async (action) => {
    console.log('Action selected:', action);
    
    if (action.id === 'delete-all') {
      // Confirm deletion
      if (!window.confirm(`Are you sure you want to delete all ${cards.length} cards for this section? This action cannot be undone.`)) {
        return;
      }
      
      try {
        // Get all card IDs for this section
        const cardIds = cards.map(card => card.id);
        
        if (cardIds.length === 0) {
          console.log('No cards to delete');
          return;
        }
        
        // Delete all cards
        const { error: deleteError } = await supabase
          .from('cards')
          .delete()
          .in('id', cardIds);
        
        if (deleteError) {
          console.error('Error deleting cards:', deleteError);
          alert('Failed to delete cards. Please try again.');
          return;
        }
        
        // Refresh the cards list and section default link
        await refreshCardsAndDefaultLink();
        alert(`Successfully deleted ${cardIds.length} cards.`);
        
      } catch (error) {
        console.error('Error in delete all cards:', error);
        alert('An error occurred while deleting cards. Please try again.');
      }
    } else {
      // TODO: Implement other actions
      console.log('Action not implemented yet:', action.id);
    }
  };

  const handleProcessClaudeResponse = async (claudeResponse) => {
    try {
      // Call the generate-prompt function to process the response
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          sectionId: sectionWithCompletion.id,
          bookId: currentBook.id,
          claudeResponse: claudeResponse
        }
      });

      if (error) {
        console.error('Error processing Claude response:', error);
        alert('Failed to process response. Please try again.');
        return;
      }

      if (data) {
        console.log('Cards processed successfully:', data);
        // Refresh cards to show the new ones
        await refreshCardsAndDefaultLink();
        setShowPromptModal(false);
        alert(`Successfully processed ${data.cardsCount} cards!`);
      }
    } catch (error) {
      console.error('Error in handleProcessClaudeResponse:', error);
      alert('An error occurred while processing the response. Please try again.');
    }
  };

  const handleGenerate = async () => {
    if (!sectionWithCompletion) return;
    
    setGenerating(true);
    try {
      // Get all snippets for this section
      const { data: snippets, error: snippetsError } = await supabase
        .from('source_snippets')
        .select('content')
        .eq('section_id', sectionWithCompletion.id)
        .order('created_at', { ascending: true });

      if (snippetsError) {
        console.error('Error fetching snippets:', snippetsError);
        alert('Failed to fetch section content. Please try again.');
        return;
      }

      if (!snippets || snippets.length === 0) {
        alert('No content found for this section. Please add some content first.');
        return;
      }

      // Calculate total characters
      const totalCharacters = snippets.reduce((sum, snippet) => sum + snippet.content.length, 0);
      
      // Create batches (max 4000 characters per batch)
      const maxCharsPerBatch = 4000;
      const batches = [];
      let currentBatch = [];
      let currentBatchChars = 0;

      for (const snippet of snippets) {
        if (currentBatchChars + snippet.content.length > maxCharsPerBatch && currentBatch.length > 0) {
          batches.push(currentBatch);
          currentBatch = [snippet];
          currentBatchChars = snippet.content.length;
        } else {
          currentBatch.push(snippet);
          currentBatchChars += snippet.content.length;
        }
      }
      
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      // Create prompt data
      const promptData = {
        sectionTitle: sectionWithCompletion.title,
        totalSnippets: snippets.length,
        totalCharacters,
        batches: batches.map((batch, index) => ({
          batchNumber: index + 1,
          snippets: batch,
          prompt: `Generate 3-5 concept cards for the following content. Each card should have a title (40-50 characters), description (100-130 characters), and main content (comprehensive explanation). Return as JSON: {"cards": [{"title": "...", "description": "...", "prompt": "..."}]}\n\nContent:\n${batch.map(s => s.content).join('\n\n')}`
        })),
        estimatedCost: `~$${(totalCharacters / 1000 * 0.015).toFixed(2)}`
      };

      setPromptData(promptData);
      setShowPromptModal(true);
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      alert('An error occurred while preparing the generation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleCardSetDone = async () => {
    if (!sectionWithCompletion || !handleUpdateSection) return;
    
    const newCardSetDoneValue = !sectionWithCompletion.card_set_done;
    
    try {
      await handleUpdateSection(sectionWithCompletion.id, { card_set_done: newCardSetDoneValue });
    } catch (error) {
      console.error('Error toggling card set done:', error);
    }
  };

  const handleSectionSelect = (section) => {
    selectSection(section.id);
  };

  const updateAncestorsIfDone = async (sectionId) => {
    try {
      // Find the section in the tree to get its ancestors
      const section = findNodeById(sections, sectionId);
      if (!section) return;

      // Get all ancestor IDs (parent, grandparent, etc.)
      const ancestorIds = getAncestorIds(sections, sectionId);
      
      // Update each ancestor that is currently done
      for (const ancestorId of ancestorIds) {
        const ancestor = findNodeById(sections, ancestorId);
        if (ancestor && ancestor.card_set_done) {
          await updateSectionFromHook(ancestorId, { card_set_done: false });
        }
      }
    } catch (error) {
      console.error('Error updating ancestors:', error);
    }
  };

  const getAncestorIds = (tree, targetId, parentId = null, path = []) => {
    for (const node of tree) {
      if (node.id === targetId) {
        return path;
      }
      
      if (node.children && node.children.length > 0) {
        const found = getAncestorIds(node.children, targetId, node.id, [...path, node.id]);
        if (found) return found;
      }
    }
    return null;
  };

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      // Use the useSections hook's updateSection function to ensure consistency
      const updatedSection = await updateSectionFromHook(sectionId, updates);
      
      if (updatedSection) {
        // Update the selected section state
        setSelectedSection(updatedSection);
      }

      // If a section is being changed from done to not done, update ancestors
      if (updates.card_set_done === false) {
        await updateAncestorsIfDone(sectionId);
      }
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {selectedSection && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              {sectionWithCompletion?.title}
            </h1>
            <div className="flex items-center space-x-2">
              {isSectionReady && (
                <>
                  {cards.length === 0 && !loading && (
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center ${
                        generating 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>Generate</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                  {cards.length > 0 && (
                    <button
                      onClick={handleToggleCardSetDone}
                      disabled={!sectionWithCompletion?.card_set_done && !canBeMarkedDone}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        sectionWithCompletion?.card_set_done
                          ? 'text-gray-500 hover:text-blue-700'
                          : canBeMarkedDone
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'text-gray-500'
                      }`}
                    >
                      {sectionWithCompletion?.card_set_done ? 'Edit' : (canBeMarkedDone ? 'Confirm' : 'Complete all subsections')}
                    </button>
                  )}
                  
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Half - Card Grid Area */}
      <div className="flex-none border-b border-gray-200">
        {selectedSection ? (
          <div className="bg-gray-50 overflow-hidden">
            {!isSectionReady ? (
              <div className="flex items-center justify-center h-100">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">📝</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Complete the source content first
                  </h2>
                  <p className="text-gray-500 leading-relaxed">
                    Complete writing the source content for this section and confirm it before creating cards. 
                    The section must be marked as done and have 100% completion.
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <CardGrid 
                cards={cards} 
                onCardClick={handleCardClick}
                onCreateCard={handleCreateCard}
                cardSetDone={sectionWithCompletion?.card_set_done}
              />
            )}
          </div>
        ) : (
          <div className="h-full bg-white flex items-center justify-center">
            <div className="text-gray-500">Select a section to view its cards</div>
          </div>
        )}
      </div>

              {/* Bottom Half - Split into quarters */}
        <div className="flex-1 flex min-h-0">
          {/* Bottom Left Quarter - Section Browser */}
          <div className="w-1/2 border-r border-gray-200 overflow-hidden">
            <ReadOnlySectionBrowser 
              onSectionSelect={handleSectionSelect}
              selectedSection={selectedSection}
              book={currentBook}
              sections={sections}
            />
          </div>

          {/* Bottom Right Quarter - Actions */}
          <div className="w-1/2 overflow-hidden">
            {selectedSection ? (
              <div className="h-full bg-white overflow-y-auto">
                {cards.length > 0 && !loading && !sectionWithCompletion?.card_set_done ? (
                  <ActionsList 
                    onActionSelect={handleActionSelect} 
                    isBlocked={!canBeMarkedDone}
                    cards={cards}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500">
                      {!isSectionReady ? 'Complete source content first' : 
                       cards.length === 0 ? 'No cards available' : 
                       sectionWithCompletion?.card_set_done ? 'Card set completed' : 
                       'Actions will appear here'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-white flex items-center justify-center">
                <div className="text-gray-500">Select a section to view actions</div>
              </div>
            )}
          </div>
        </div>

      {/* Card Edit Modal */}
      <CardEditModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleCardSave}
        onDelete={handleCardDelete}
        selectedSection={sectionWithCompletion}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        promptData={promptData}
        onProcessResponse={handleProcessClaudeResponse}
      />
    </div>
  );
};

export default CardsPage; 