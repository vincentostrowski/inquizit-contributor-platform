import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
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
  const [updatingOrder, setUpdatingOrder] = useState(false);

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
          ),
          card_completion_tracking (
            title_completed,
            description_completed,
            content_completed,
            banner_completed,
            quizit_configuration_completed,
            is_completed
          )
        `)
        .in('id', (
          await supabase
            .from('snippet_chunks_for_context')
            .select('card_id')
            .in('source_section_id', sectionIds)
        ).data?.map(chunk => chunk.card_id) || [])
        .order('order', { ascending: true });

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
      content: '',
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

  // Function to upload banner image to Supabase storage (store by card path)
  const uploadBanner = async (file, cardId) => {
    const fileExt = (file.name?.split('.').pop() || 'png').toLowerCase();
    const path = `cards/${cardId}/banner.${fileExt}`;

    const { error } = await supabase.storage
      .from('card-banners')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/png' });

    if (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('card-banners')
      .getPublicUrl(path);

    return publicUrl;
  };

  const handleCardDelete = async (cardId) => {
    try {
      // Best-effort: delete banner file from storage first
      try {
        const card = cards.find(c => c.id === cardId);
        const bannerUrl = card?.banner;
        if (bannerUrl) {
          const cleanOld = bannerUrl.split('?')[0];
          const marker = '/storage/v1/object/public/card-banners/';
          const idx = cleanOld.indexOf(marker);
          if (idx !== -1) {
            const oldPath = cleanOld.substring(idx + marker.length);
            await supabase.storage.from('card-banners').remove([oldPath]);
          }
        }
      } catch (e) {
        console.warn('Failed to delete banner from storage on card delete (safe to ignore):', e);
      }

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

  // Handle completion tracking updates
  const handleCompletionUpdate = (cardId, completionData) => {
    setCards(prevCards => {
      const updatedCards = prevCards.map(card => 
        card.id === cardId 
          ? {
              ...card,
              card_completion_tracking: completionData
            }
          : card
      );
      
      return updatedCards;
    });
  };

  // Handle card save
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
          quizit_components: updatedCard.quizit_components || '',
          words_to_avoid: updatedCard.words_to_avoid || '',
          content: updatedCard.content || '',
          order: updatedCard.order || cards.length + 1,
          card_idea: updatedCard.card_idea || '',
          book: currentBook.id,
          source_section: sectionWithCompletion.id
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
        
        // Upload banner if provided
        if (updatedCard.bannerFile) {
          try {
            const bannerUrl = await uploadBanner(updatedCard.bannerFile, cardId);
            // Version the URL to defeat caches
            const cleanUrl = bannerUrl.split('?')[0];
            const versionedUrl = `${cleanUrl}?v=${Date.now()}`;
            // Update card with banner URL
            const { error: bannerUpdateError } = await supabase
              .from('cards')
              .update({ banner: versionedUrl })
              .eq('id', cardId);
              
            if (bannerUpdateError) {
              console.error('Error updating card with banner URL:', bannerUpdateError);
            }
          } catch (error) {
            console.error('Error uploading banner:', error);
            // Continue with card creation even if banner upload fails
          }
        }
        
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
          quizit_components: updatedCard.quizit_components || '',
          words_to_avoid: updatedCard.words_to_avoid || '',
          content: updatedCard.content || '',
          order: updatedCard.order || selectedCard.order,
          card_idea: updatedCard.card_idea || ''
        };
        
        // Upload banner if provided
        if (updatedCard.bannerFile) {
          try {
            const bannerUrl = await uploadBanner(updatedCard.bannerFile, selectedCard.id);
            const cleanUrl = bannerUrl.split('?')[0];
            const versionedUrl = `${cleanUrl}?v=${Date.now()}`;
            cardData.banner = versionedUrl;
          } catch (error) {
            console.error('Error uploading banner:', error);
            // Continue with card update even if banner upload fails
          }
        } else if (!updatedCard.banner && selectedCard.banner) {
          // User removed banner: clear DB field and try to delete old file
          cardData.banner = '';
          try {
            const cleanOld = selectedCard.banner.split('?')[0];
            const marker = '/storage/v1/object/public/card-banners/';
            const idx = cleanOld.indexOf(marker);
            if (idx !== -1) {
              const oldPath = cleanOld.substring(idx + marker.length);
              await supabase.storage.from('card-banners').remove([oldPath]);
            }
          } catch (e) {
            console.warn('Failed to delete old banner from storage (safe to ignore):', e);
          }
        }
        
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

      // Persist quizit tests only on Save, if any are present
      const drafts = updatedCard?.pendingPromptTests;
      if (cardId && drafts && drafts.slots) {
        // Generate hash from the new quizit fields
        const components = updatedCard.quizit_components || '';
        const wordsToAvoid = updatedCard.words_to_avoid || '';
        const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
        
        // Simple hash function for consistency with UI (same as djb2 fallback)
        const generateHash = (text) => {
          let hash = 5381;
          for (let i = 0; i < text.length; i += 1) {
            hash = ((hash << 5) + hash) + text.charCodeAt(i);
            hash |= 0; // force 32-bit
          }
          // Convert to hex string (same format as UI fallback)
          return (hash >>> 0).toString(16).padStart(8, '0');
        };
        
        const newPromptHash = generateHash(combinedContent);
        
        // First, delete any existing tests for this card (they're now irrelevant)
        const { error: deleteError } = await supabase
          .from('card_prompt_tests')
          .delete()
          .eq('card_id', cardId);
        
        if (deleteError) {
          console.error('Error deleting old prompt tests:', deleteError);
          // Continue anyway - we'll try to save new tests
        }
        
        // Now save the new tests with the new hash
        const rows = [0,1,2,3,4]
          .map((slot) => {
            const s = drafts.slots?.[slot];
            if (!s) return null;
            const hasContent = (s.quizit?.trim() || s.reasoning?.trim() || s.feedback?.trim());
            if (!hasContent && !s.isTested && !s.confirmed) return null;
            return {
              card_id: cardId,
              slot,
              prompt_hash: newPromptHash,
              quizit: s.quizit || '',
              reasoning: s.reasoning || '',
              feedback: s.feedback || '',
              confirmed: !!s.confirmed
            };
          })
          .filter(Boolean);

        if (rows.length > 0) {
          const { error: insertError } = await supabase
            .from('card_prompt_tests')
            .insert(rows);
          if (insertError) {
            console.error('Error inserting new prompt tests:', insertError);
          }
        }
      }

      // Refresh cards and section default link
      await refreshCardsAndDefaultLink();
      
      // Return success - don't close modal
      return { success: true, card: { id: cardId } };
    } catch (error) {
      console.error('Error saving card:', error);
      // Return error - don't close modal
      throw error;
    }
  };

  const handleActionSelect = async (action) => {
    
    if (action.id === 'delete-all') {
      // Confirm deletion
      if (!window.confirm(`Are you sure you want to delete all ${cards.length} cards for this section? This action cannot be undone.`)) {
        return;
      }
      
      try {
        // Get all card IDs for this section
        const cardIds = cards.map(card => card.id);
        // Best-effort: delete all banners for these cards from storage
        try {
          const paths = cards
            .map(card => card.banner)
            .filter(Boolean)
            .map(url => {
              const clean = url.split('?')[0];
              const marker = '/storage/v1/object/public/card-banners/';
              const idx = clean.indexOf(marker);
              return idx !== -1 ? clean.substring(idx + marker.length) : null;
            })
            .filter(Boolean);
          if (paths.length > 0) {
            await supabase.storage.from('card-banners').remove(paths);
          }
        } catch (e) {
          console.warn('Failed to delete some banners during delete-all (safe to ignore):', e);
        }
        
        if (cardIds.length === 0) {
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
    }
  };

  const handleProcessClaudeResponse = async (claudeResponse) => {
    try {
      // 1) Delete existing cards for the selected section before inserting new ones
      // Reuse the same deletion approach as the "Delete All Cards" action, but scoped to this section
      if (sectionWithCompletion) {
        // Filter to cards linked to the current section (not descendants)
        const cardIdsForSection = cards
          .filter((card) => Array.isArray(card.snippet_chunks_for_context)
            ? card.snippet_chunks_for_context.some((chunk) => chunk.source_section_id === sectionWithCompletion.id)
            : false)
          .map((card) => card.id);

        if (cardIdsForSection.length > 0) {
          const { error: deleteBeforeInsertError } = await supabase
            .from('cards')
            .delete()
            .in('id', cardIdsForSection);

          if (deleteBeforeInsertError) {
            console.error('Error deleting existing cards before processing response:', deleteBeforeInsertError);
            // Proceeding is risky because we might end up with mixed old/new cards
            // But we keep going per request; alternatively, we could return here
          }
        }
      }

      // 2) Process the Claude response to insert new cards
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          action: 'process-response',
          sectionId: sectionWithCompletion.id,
          bookId: currentBook.id,
          claudeResponse
        }
      });
      
      if (error) {
        console.error('Error processing Claude response:', error);
        return;
      }
      
      // 3) Refresh cards list
      await refreshCardsAndDefaultLink();
      setShowPromptModal(false);
      setPromptData(null);
      
    } catch (error) {
      console.error('Error processing Claude response:', error);
    }
  };

  const handleGenerate = async () => {
    if (!sectionWithCompletion || generating) return;
    
    setGenerating(true);
    
    try {
      // Step 1: Generate prompts
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          action: 'generate-prompt',
          sectionId: sectionWithCompletion.id,
          bookId: currentBook.id
        }
      });
      
      if (error) {
        console.error('Error generating prompts:', error);
        alert(`Error: ${error.message}`);
        return;
      }
      
      // Step 2: Show prompts to user
      setPromptData(data.data || data); // Handle both nested and direct data
      setShowPromptModal(true);
      
    } catch (error) {
      console.error('Error generating prompts:', error);
      alert(`Unexpected error: ${error.message}`);
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

  const handleDragEnd = (result) => {
    // If no destination, nothing to do
    if (!result.destination) {
      return;
    }

    // If dropped in the same position, nothing to do
    if (result.destination.index === result.source.index) {
      return;
    }

    // Calculate new order
    const newCards = Array.from(cards);
    const [reorderedCard] = newCards.splice(result.source.index, 1);
    newCards.splice(result.destination.index, 0, reorderedCard);

    // Update the cards state immediately for UI feedback
    setCards(newCards);

    // Update database with new order
    updateCardOrderInDatabase(newCards);
  };

  // Function to update card order in database
  const updateCardOrderInDatabase = async (newCards) => {
    setUpdatingOrder(true);
    try {
      // Only update cards whose position actually changed
      const cardsToUpdate = newCards.filter((card, newIndex) => {
        const originalCard = cards.find(c => c.id === card.id);
        const originalIndex = cards.indexOf(originalCard);
        return originalIndex !== newIndex;
      });

      if (cardsToUpdate.length === 0) {
        return;
      }

      // Create batch update operations only for changed cards
      const updatePromises = cardsToUpdate.map((card, index) => {
        const newIndex = newCards.indexOf(card);
        return supabase
          .from('cards')
          .update({ order: newIndex + 1 })
          .eq('id', card.id);
      });

      // Execute all updates
      const results = await Promise.all(updatePromises);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Error updating card order:', errors);
        // Optionally revert the UI state if database update fails
        // await refreshCardsAndDefaultLink();
      } else {
        // updated successfully
      }
    } catch (error) {
      console.error('Error updating card order:', error);
      // Optionally revert the UI state if database update fails
      // await refreshCardsAndDefaultLink();
    } finally {
      setUpdatingOrder(false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className="flex flex-col h-full">

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
                updatingOrder={updatingOrder}
              />
            )}
          </div>
        ) : (
          <div className="h-full bg-white flex items-center justify-center">
            <div className="text-gray-500"></div>
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
                {!isSectionReady || loading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-gray-500">Complete source content first</div>
                  </div>
                ) : cards.length === 0 ? (
                  <ActionsList 
                    onActionSelect={handleActionSelect} 
                    isBlocked={!canBeMarkedDone}
                    cards={cards}
                    generating={generating}
                    onGenerate={handleGenerate}
                  />
                ) : sectionWithCompletion?.card_set_done ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-500 mb-2">Card set completed</div>
                      <button
                        onClick={handleToggleCardSetDone}
                        className="text-gray-500 hover:text-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <ActionsList 
                    onActionSelect={handleActionSelect} 
                    isBlocked={!canBeMarkedDone}
                    cards={cards}
                    generating={generating}
                    onGenerate={handleGenerate}
                    onConfirm={handleToggleCardSetDone}
                    canConfirm={canBeMarkedDone}
                    isConfirmed={sectionWithCompletion?.card_set_done}
                  />
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
        completionData={(() => {
          const completionData = selectedCard?.card_completion_tracking || null;
          return completionData;
        })()}
        onCompletionUpdate={handleCompletionUpdate}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        promptData={promptData}
        onProcessResponse={handleProcessClaudeResponse}
      />
    </div>
    </DragDropContext>
  );
};

export default CardsPage; 