import React, { useState, useEffect } from 'react';
import CardGrid from './CardGrid';
import ActionsList from './ActionsList';
import { CardEditModal } from './card_editor';
import PromptModal from './PromptModal';
import { supabase } from '../../services/supabaseClient';
import { useSections } from '../../hooks/useSections';
import { findNodeById } from '../../utils/treeUtils';

const CardDrawer = ({ selectedSection, onUpdateSection, book }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sectionDefaultLink, setSectionDefaultLink] = useState(null);
  const { sections, refreshSections } = useSections(book);

  // Find the selected section from the processed sections data
  const sectionWithCompletion = selectedSection && sections.length > 0 
    ? findNodeById(sections, selectedSection.id) 
    : null;

  // Check if section is ready for card creation
  const isSectionReady = sectionWithCompletion?.sources_done && sectionWithCompletion?.completion?.percentage === 100;

  // Check if all children are done (only for sections with children)
  // Only calculate if sections data is properly loaded
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
    const { data: cardsData, error } = await supabase
      .from('cards')
      .select(`
        *,
        snippet_chunks_for_context!inner (
          id,
          created_at,
          source_section_id,
          source_snippet_id,
          link,
          card_id,
          source_sections (
            id,
            title
          )
        )
      `)
      .in('snippet_chunks_for_context.source_section_id', sectionIds)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
    
    return cardsData || [];
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



  // Fetch cards and section default link when sectionWithCompletion changes
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
  

  const handleCreateCard = () => {
    // Create an empty card object for the modal
    const newCard = {
      title: '',
      description: '',
      prompt: '',
      order: cards.length + 1, // Set order to be after existing cards
      banner: '',
      card_idea: '',
      book: book.id, // Link to current book
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
          book: book.id
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
        // Include all valid fields from the cards table schema
        const cardData = {
          title: updatedCard.title || '',
          description: updatedCard.description || '',
          prompt: updatedCard.prompt || '',
          order: updatedCard.order || selectedCard.order,
          banner: updatedCard.banner || '',
          card_idea: updatedCard.card_idea || ''
        };
        
        // Update existing card
        const { error: updateError } = await supabase
          .from('cards')
          .update(cardData)
          .eq('id', selectedCard.id);

        if (updateError) {
          console.error('Error updating card:', updateError);
          return;
        }
        
        cardId = selectedCard.id;
      }

      // Refresh cards and section default link
      await refreshCardsAndDefaultLink();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const [promptData, setPromptData] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const handleGenerate = async () => {
    if (!sectionWithCompletion || generating) return;
    
    console.log('Starting generate process...', {
      sectionId: sectionWithCompletion.id,
      bookId: book.id,
      sectionTitle: sectionWithCompletion.title
    });
    
    setGenerating(true);
    
    try {
      // Step 1: Generate prompts
      console.log('Calling generate-prompt function...');
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          action: 'generate-prompt',
          sectionId: sectionWithCompletion.id,
          bookId: book.id
        }
      });
      
      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Error generating prompts:', error);
        alert(`Error: ${error.message}`);
        return;
      }
      
      // Step 2: Show prompts to user
      console.log('Setting prompt data:', data);
      setPromptData(data.data || data); // Handle both nested and direct data
      setShowPromptModal(true);
      
    } catch (error) {
      console.error('Error generating prompts:', error);
      alert(`Unexpected error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleProcessClaudeResponse = async (claudeResponse) => {
    try {
      // Process the Claude response
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          action: 'process-response',
          sectionId: sectionWithCompletion.id,
          bookId: book.id,
          claudeResponse
        }
      });
      
      if (error) {
        console.error('Error processing Claude response:', error);
        return;
      }
      
      // Refresh cards list
      const sectionIds = getAllSectionIds(sectionWithCompletion);
      const cardsData = await fetchCardsWithLinks(sectionIds);
      setCards(cardsData);
      setShowPromptModal(false);
      setPromptData(null);
      
    } catch (error) {
      console.error('Error processing Claude response:', error);
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

  const handleToggleCardSetDone = async () => {
    if (!sectionWithCompletion || !onUpdateSection) return;
    
    const newCardSetDoneValue = !sectionWithCompletion.card_set_done;
    
    try {
      await onUpdateSection(sectionWithCompletion.id, { card_set_done: newCardSetDoneValue });
      // Refresh sections data to update the UI
      await refreshSections();
    } catch (error) {
      console.error('Error toggling card set done:', error);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {!isSectionReady ? (
          <div className="flex items-center justify-center h-full">
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
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
              <CardGrid 
                cards={cards} 
                onCardClick={handleCardClick}
                onCreateCard={handleCreateCard}
                cardSetDone={sectionWithCompletion?.card_set_done}
              />
            {cards.length > 0 && !loading && !sectionWithCompletion?.card_set_done && (
              <div className="border-t border-gray-200 flex-1 min-h-0">
                <ActionsList 
                  onActionSelect={handleActionSelect} 
                  isBlocked={!canBeMarkedDone}
                />
              </div>
            )}
          </div>
        )}
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

export default CardDrawer; 