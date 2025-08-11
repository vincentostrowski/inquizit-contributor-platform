import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useBook } from '../context/BookContext';
import { useSections } from '../hooks/useSections';
import { useUrlState } from '../hooks/useUrlState';
import { supabase } from '../services/supabaseClient';
import OrganizeLeftPanel from '../components/organize/OrganizeLeftPanel';
import OrganizeRightPanel from '../components/organize/OrganizeRightPanel';

const Organize = () => {
  const { currentBook } = useBook();
  const { sections } = useSections(currentBook);
  const { bookId, selectBook } = useUrlState();
  
  // Unified state management for organize operations
  const [organizeState, setOrganizeState] = useState({
    // Source sections (left panel) - read-only from database
    sourceSections: [],
    
    // Destination sections (right panel) - local state
    destinationSections: [],
    
    // Cards state - local state
    unorganizedCards: {}, // keyed by source section ID
    organizedCards: {},   // keyed by destination section ID
    
    // Pending changes - what will be saved
    pendingCardMoves: [], // {cardId, fromSectionId, toSectionId, finalOrder}
    pendingSectionChanges: [], // {sectionId, changes} for updates
    pendingSectionCreations: [], // {tempId, sectionData} for new sections
    pendingSectionDeletions: [], // [sectionId, sectionId, ...]
    
    // UI state
    draggedCard: null,
    draggedCardSection: null,
    
    // Save state
    isSaving: false,
    saveError: null,
    
    // Loading state
    isLoading: false,
    
    // Force update trigger
    forceUpdate: null
  });
  
  // State update functions
  const updateOrganizeState = useCallback((updates) => {
    setOrganizeState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const addPendingCardMove = useCallback((cardMove) => {
    setOrganizeState(prev => ({
      ...prev,
      pendingCardMoves: [...prev.pendingCardMoves, cardMove]
    }));
  }, []);
  
  const addPendingSectionCreation = useCallback((sectionData) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setOrganizeState(prev => ({
      ...prev,
      pendingSectionCreations: [...prev.pendingSectionCreations, { tempId, ...sectionData }]
    }));
    return tempId;
  }, []);
  
  const addPendingSectionChange = useCallback((sectionId, changes) => {
    setOrganizeState(prev => ({
      ...prev,
      pendingSectionChanges: [...prev.pendingSectionChanges, { sectionId, changes }]
    }));
  }, []);
  
  const addPendingSectionDeletion = useCallback((sectionId) => {
    setOrganizeState(prev => ({
      ...prev,
      pendingSectionDeletions: [...prev.pendingSectionDeletions, sectionId]
    }));
  }, []);

  // Remove single card from organized section
  const removeCardFromSection = useCallback((sectionId, cardId) => {
    // Find the card to remove
    const card = organizeState.organizedCards[sectionId]?.find(c => c.id === cardId);
    if (!card) return;
    
    // Add to pending changes
    addPendingCardMove({
      type: 'remove_from_section',
      cardId: card.id,
      fromSectionId: sectionId,
      sourceSection: card.source_section
    });
    
    // Update local state immediately
    const newUnorganizedCards = { ...organizeState.unorganizedCards };
    const newOrganizedCards = { ...organizeState.organizedCards };
    
    // Remove card from organized state
    newOrganizedCards[sectionId] = newOrganizedCards[sectionId].filter(c => c.id !== cardId);
    
    // Add card back to its original source section (copying existing logic)
    const targetSourceSection = organizeState.sourceSections.find(s => s.id === card.source_section);
    
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
    
    // Update state
    updateOrganizeState({
      unorganizedCards: newUnorganizedCards,
      organizedCards: newOrganizedCards
    });
  }, [organizeState, addPendingCardMove, updateOrganizeState]);
  
  // Data fetching functions
  const fetchUnorganizedCards = useCallback(async () => {
    if (!sections || sections.length === 0) return {};
    
    try {
      // Optimized query - only fetch fields needed for organization
      const { data: allUnorganizedCards, error } = await supabase
        .from('cards')
        .select('id, title, description, banner, source_section, order')
        .is('section', null)  // Unorganized cards
        .order('order', { ascending: true });

      if (error) throw error;

      // Group cards by their source_section
      const cardsBySection = {};
      allUnorganizedCards?.forEach(card => {
        if (card.source_section) {
          if (!cardsBySection[card.source_section]) {
            cardsBySection[card.source_section] = [];
          }
          cardsBySection[card.source_section].push(card);
        }
      });
      
      return cardsBySection;
    } catch (error) {
      console.error('Error fetching unorganized cards:', error);
      return {};
    }
  }, [sections]);
  
  const fetchDestinationSections = useCallback(async () => {
    try {
      // Optimized query - only fetch fields needed for organization
      const { data: cardSections, error } = await supabase
        .from('card_sections')
        .select('id, title, description, created_at')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return cardSections || [];
    } catch (error) {
      console.error('Error fetching destination sections:', error);
      return [];
    }
  }, []);
  
  const fetchOrganizedCards = useCallback(async () => {
    try {
      // Optimized query - only fetch fields needed for organization
      const { data: organizedCards, error } = await supabase
        .from('cards')
        .select('id, title, description, banner, section, source_section, final_order')
        .not('section', 'is', null)
        .order('final_order', { ascending: true });
      
      if (error) throw error;
      
      // Group cards by section
      const cardsBySection = {};
      organizedCards?.forEach(card => {
        if (card.section) {
          if (!cardsBySection[card.section]) {
            cardsBySection[card.section] = [];
          }
          cardsBySection[card.section].push(card);
        }
      });
      
      return cardsBySection;
    } catch (error) {
      console.error('Error fetching organized cards:', error);
      return {};
    }
  }, []);
  
  // Handle left to right card moves
  const handleLeftToRightMove = (source, destination, draggableId) => {
    const sourceSectionId = parseInt(source.droppableId.replace('left-section-', ''));
    const destinationSectionId = destination.droppableId.replace('right-section-', '');
    
    // Find the card being moved
    const card = organizeState.unorganizedCards[sourceSectionId]?.find(c => c.id.toString() === draggableId);
    
    if (!card) {
      console.error('Card not found:', draggableId);
      return;
    }
    
    // Add the card move to pending changes
    const cardMove = {
      type: 'left_to_right',
      cardId: card.id,
      fromSectionId: sourceSectionId,
      toSectionId: destinationSectionId,
      dropIndex: destination.index,
      originalSourceSectionId: sourceSectionId  // NEW: Track original source for restoration
    };
    
    addPendingCardMove(cardMove);
    
    // Update local state immediately for UI feedback
    const newUnorganizedCards = { ...organizeState.unorganizedCards };
    const newOrganizedCards = { ...organizeState.organizedCards };
    
    // Remove card from source section
    newUnorganizedCards[sourceSectionId] = newUnorganizedCards[sourceSectionId].filter(c => c.id !== card.id);
    
    // Add card to destination section at the specific drop position
    if (!newOrganizedCards[destinationSectionId]) {
      newOrganizedCards[destinationSectionId] = [];
    }
    
    // Insert card at the specific drop position
    const dropIndex = destination.index;
    newOrganizedCards[destinationSectionId].splice(dropIndex, 0, {
      ...card,
      final_order: dropIndex + 1,
      section: destinationSectionId,
      originalSourceSectionId: sourceSectionId  // Store original source directly on card
    });
    
    // Recalculate final_order for all cards after the insertion point
    for (let i = dropIndex + 1; i < newOrganizedCards[destinationSectionId].length; i++) {
      newOrganizedCards[destinationSectionId][i] = {
        ...newOrganizedCards[destinationSectionId][i],
        final_order: i + 1
      };
    }
    
    // Update the state
    updateOrganizeState({
      unorganizedCards: newUnorganizedCards,
      organizedCards: newOrganizedCards
    });
    
  };

  // Handle right to right card moves (reordering within section or moving between sections)
  const handleRightToRightMove = (source, destination, draggableId) => {
    const sourceSectionId = source.droppableId.replace('right-section-', '');
    const destSectionId = destination.droppableId.replace('right-section-', '');
    
    // Find the card being moved
    const card = organizeState.organizedCards[sourceSectionId]?.find(c => c.id.toString() === draggableId);
    
    if (!card) {
      console.error('Card not found:', draggableId);
      return;
    }
    
    // Case 1: Reordering within the same section
    if (sourceSectionId === destSectionId) {
      handleReorderWithinSection(sourceSectionId, source.index, destination.index, card);
    }
    // Case 2: Moving between different right sections
    else {
      handleMoveBetweenRightSections(sourceSectionId, destSectionId, source.index, destination.index, card);
    }
  };

  // Handle reordering within the same section
  const handleReorderWithinSection = (sectionId, sourceIndex, destIndex, card) => {
    const sectionCards = [...(organizeState.organizedCards[sectionId] || [])];
    
    // Remove card from source position
    sectionCards.splice(sourceIndex, 1);
    
    // Insert card at destination position
    sectionCards.splice(destIndex, 0, card);
    
    // Recalculate final_order for all affected cards
    const updatedCards = sectionCards.map((card, index) => ({
      ...card,
      final_order: index + 1
    }));
    
    // Update local state
    const newOrganizedCards = { ...organizeState.organizedCards };
    newOrganizedCards[sectionId] = updatedCards;
    
    updateOrganizeState({ organizedCards: newOrganizedCards });
    
    // Add to pending changes for database save
    const reorderMove = {
      type: 'reorder',
      sectionId,
      cardId: card.id,
      newFinalOrder: destIndex + 1,
      oldFinalOrder: sourceIndex + 1
    };
    
    addPendingCardMove(reorderMove);
    
  };

  // Handle moving between different right sections
  const handleMoveBetweenRightSections = (sourceSectionId, destSectionId, sourceIndex, destIndex, card) => {
    // Remove card from source section
    const sourceCards = [...(organizeState.organizedCards[sourceSectionId] || [])];
    sourceCards.splice(sourceIndex, 1);
    
    // Recalculate final_order for source section
    const updatedSourceCards = sourceCards.map((card, index) => ({
      ...card,
      final_order: index + 1
    }));
    
    // Add card to destination section
    const destCards = [...(organizeState.organizedCards[destSectionId] || [])];
    destCards.splice(destIndex, 0, {
      ...card,
      section: destSectionId,
      final_order: destIndex + 1
    });
    
    // Recalculate final_order for destination section
    const updatedDestCards = destCards.map((card, index) => ({
      ...card,
      final_order: index + 1
    }));
    
    // Update local state
    const newOrganizedCards = { ...organizeState.organizedCards };
    newOrganizedCards[sourceSectionId] = updatedSourceCards;
    newOrganizedCards[destSectionId] = updatedDestCards;
    
    updateOrganizeState({ organizedCards: newOrganizedCards });
    
    // Add to pending changes for database save
    const moveBetweenSections = {
      type: 'move_between_sections',
      cardId: card.id,
      fromSectionId: sourceSectionId,
      toSectionId: destSectionId,
      newFinalOrder: destIndex + 1
    };
    
    addPendingCardMove(moveBetweenSections);
    
  };

  // Initial data load function
  const loadInitialData = useCallback(async () => {
    try {
      updateOrganizeState({ isLoading: true });
      
      // Load all data in parallel
      const [unorganizedCards, destinationSections, organizedCards] = await Promise.all([
        fetchUnorganizedCards(),
        fetchDestinationSections(),
        fetchOrganizedCards()
      ]);
      
      updateOrganizeState({
        unorganizedCards,
        destinationSections,
        organizedCards,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      updateOrganizeState({ isLoading: false });
    }
  }, [fetchUnorganizedCards, fetchDestinationSections, fetchOrganizedCards, updateOrganizeState]);

  // Save all pending changes to database
  const handleSave = useCallback(async () => {
    try {
      updateOrganizeState({ isSaving: true, saveError: null });
      
      // Process deletions first (to avoid foreign key conflicts)
      for (const sectionId of organizeState.pendingSectionDeletions) {
        // Ensure sectionId is a valid string or number
        if (!sectionId || typeof sectionId !== 'string' && typeof sectionId !== 'number') {
          continue;
        }
        
        // Handle temporary IDs - if it's a temp ID, we can't delete it from DB yet
        // since it hasn't been created. Just skip it and it will be cleaned up.
        if (typeof sectionId === 'string' && sectionId.startsWith('temp-')) {
          continue;
        }
        
        // Move all cards in this section back to unorganized state
        const sectionCards = organizeState.organizedCards[sectionId] || [];
        for (const card of sectionCards) {
          await supabase
            .from('cards')
            .update({ 
              section: null, 
              final_order: null 
            })
            .eq('id', card.id);
        }
        
        // Delete the section
        const { error } = await supabase
          .from('card_sections')
          .delete()
          .eq('id', sectionId);
        
        if (error) throw error;
      }
      
      // Create new sections
      const tempIdToRealIdMap = {}; // Map temp IDs to real IDs
      
      for (const pendingSection of organizeState.pendingSectionCreations) {
        const { data: newSection, error } = await supabase
          .from('card_sections')
          .insert({
            title: pendingSection.title,
            description: pendingSection.description,
            book: currentBook.id,
            order: (organizeState.destinationSections.length + organizeState.pendingSectionCreations.length)
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Store the mapping from temp ID to real ID
        tempIdToRealIdMap[pendingSection.tempId] = newSection.id;
        
        // Update any cards that were assigned to this temp section
        const tempSectionCards = organizeState.organizedCards[pendingSection.tempId] || [];
        for (const card of tempSectionCards) {
          await supabase
            .from('cards')
            .update({ 
              section: newSection.id,
              final_order: card.final_order 
            })
            .eq('id', card.id);
        }
      }
      
      // Update existing sections
      for (const change of organizeState.pendingSectionChanges) {
        // Ensure sectionId is valid
        if (!change.sectionId || typeof change.sectionId !== 'string' && typeof change.sectionId !== 'number') {
          continue;
        }
        
        // Handle temporary IDs by mapping them to real IDs
        let realSectionId = change.sectionId;
        if (typeof change.sectionId === 'string' && change.sectionId.startsWith('temp-')) {
          realSectionId = tempIdToRealIdMap[change.sectionId];
          if (!realSectionId) {
            console.error('No real ID found for temp section:', change.sectionId);
            continue; // Skip this change if we can't resolve the temp ID
          }
        }
        
        const { error } = await supabase
          .from('card_sections')
          .update(change.changes)
          .eq('id', realSectionId);
        
        if (error) throw error;
      }
      
              // Process all card moves
        for (const move of organizeState.pendingCardMoves) {
          if (move.type === 'left_to_right') {
            // Card moved from unorganized to organized
            // Calculate final_order based on dropIndex
            const finalOrder = move.dropIndex + 1;
            
            // Get the real section ID (handle temporary IDs)
            let realToSectionId = move.toSectionId;
            if (typeof move.toSectionId === 'string' && move.toSectionId.startsWith('temp-')) {
              realToSectionId = tempIdToRealIdMap[move.toSectionId];
              if (!realToSectionId) {
                console.error('No real ID found for temp section:', move.toSectionId);
                continue; // Skip this move if we can't resolve the temp ID
              }
            }
            
            const { error } = await supabase
              .from('cards')
              .update({ 
                section: realToSectionId,
                final_order: finalOrder 
              })
              .eq('id', move.cardId);
            
            if (error) throw error;
            
            // Update final_order for all cards after the insertion point
            const { data: sectionCards, error: fetchError } = await supabase
              .from('cards')
              .select('id, final_order')
              .eq('section', realToSectionId)
              .not('section', 'is', null)
              .order('final_order', { ascending: true });
            
            if (fetchError) throw fetchError;
            
            // Recalculate final_order for all cards after the insertion point
            for (let i = move.dropIndex + 1; i < sectionCards.length; i++) {
              const card = sectionCards[i];
              if (card.final_order !== i + 1) {
                const { error: updateError } = await supabase
                  .from('cards')
                  .update({ final_order: i + 1 })
                  .eq('id', card.id);
                
                if (updateError) throw updateError;
              }
            }
            
          } else if (move.type === 'reorder') {
            // Card reordered within same section
            // Handle temporary section IDs
            let realSectionId = move.sectionId;
            if (typeof move.sectionId === 'string' && move.sectionId.startsWith('temp-')) {
              realSectionId = tempIdToRealIdMap[move.sectionId];
              if (!realSectionId) {
                console.error('No real ID found for temp section:', move.sectionId);
                continue; // Skip this move if we can't resolve the temp ID
              }
            }
            
            // First, get all cards in this section from our current state
            const currentSectionCards = organizeState.organizedCards[move.sectionId] || [];
            
            // Create a map of card ID to desired final_order
            const cardOrderMap = {};
            currentSectionCards.forEach((card, index) => {
              cardOrderMap[card.id] = index + 1;
            });
            
            // Update all cards in this section with their new final_order values
            for (const card of currentSectionCards) {
              const { error } = await supabase
                .from('cards')
                .update({ final_order: cardOrderMap[card.id] })
                .eq('id', card.id);
              
              if (error) throw error;
            }
            
          } else if (move.type === 'move_between_sections') {
            // Card moved between different sections
            // Get the real section IDs (handle temporary IDs)
            let realFromSectionId = move.fromSectionId;
            let realToSectionId = move.toSectionId;
            
            if (typeof move.fromSectionId === 'string' && move.fromSectionId.startsWith('temp-')) {
              realFromSectionId = tempIdToRealIdMap[move.fromSectionId];
              if (!realFromSectionId) {
                console.error('No real ID found for temp source section:', move.fromSectionId);
                continue; // Skip this move if we can't resolve the temp ID
              }
            }
            
            if (typeof move.toSectionId === 'string' && move.toSectionId.startsWith('temp-')) {
              realToSectionId = tempIdToRealIdMap[move.toSectionId];
              if (!realToSectionId) {
                console.error('No real ID found for temp destination section:', move.toSectionId);
                continue; // Skip this move if we can't resolve the temp ID
              }
            }
            
            const { error } = await supabase
              .from('cards')
              .update({ 
                section: realToSectionId,
                final_order: move.newFinalOrder 
              })
              .eq('id', move.cardId);
            
            if (error) throw error;
            
            // Recalculate final_order for both source and destination sections
            const [sourceCards, destCards] = await Promise.all([
              supabase
                .from('cards')
                .select('id, final_order')
                .eq('section', realFromSectionId)
                .not('section', 'is', null)
                .order('final_order', { ascending: true }),
              supabase
                .from('cards')
                .select('id, final_order')
                .eq('section', realToSectionId)
                .not('section', 'is', null)
                .order('final_order', { ascending: true })
            ]);
            
            if (sourceCards.error) throw sourceCards.error;
            if (destCards.error) throw destCards.error;
            
            // Update source section final_order values
            for (let i = 0; i < sourceCards.data.length; i++) {
              const card = sourceCards.data[i];
              if (card.final_order !== i + 1) {
                const { error: updateError } = await supabase
                  .from('cards')
                  .update({ final_order: i + 1 })
                  .eq('id', card.id);
                
                if (updateError) throw updateError;
              }
            }
            
            // Update destination section final_order values
            for (let i = 0; i < destCards.data.length; i++) {
              const card = destCards.data[i];
              if (card.final_order !== i + 1) {
                const { error: updateError } = await supabase
                  .from('cards')
                  .update({ final_order: i + 1 })
                  .eq('id', card.id);
                
                if (updateError) throw updateError;
              }
            }
          } else if (move.type === 'remove_from_section') {
            // Card removed from organized section - set section to null
            const { error } = await supabase
              .from('cards')
              .update({ 
                section: null,
                final_order: null
              })
              .eq('id', move.cardId);
            
            if (error) throw error;
          }
        }
      
      // Success: Clear all pending changes
      updateOrganizeState({
        pendingCardMoves: [],
        pendingSectionCreations: [],
        pendingSectionChanges: [],
        pendingSectionDeletions: [],
        isSaving: false
      });
      
      // Reload data from database
      await loadInitialData();
      
    } catch (error) {
      console.error('Save failed:', error);
      updateOrganizeState({ 
        isSaving: false, 
        saveError: error.message 
      });
    }
  }, [organizeState, currentBook, updateOrganizeState, loadInitialData]);
  
  // Initialize source sections and load data when sections change
  useEffect(() => {
    if (sections && sections.length > 0) {
      updateOrganizeState({ sourceSections: sections });
      loadInitialData();
    }
  }, [sections, updateOrganizeState, loadInitialData]);
  
  const handleDragEnd = (result) => {
    
    // Always reset the dragged card state
    updateOrganizeState({
      draggedCard: null,
      draggedCardSection: null
    });
    
    // If no destination, the card was dropped outside a valid drop zone
    if (!result.destination) {
      // Force a re-render to ensure cards are properly restored
      setTimeout(() => {
        updateOrganizeState({ forceUpdate: Date.now() });
      }, 0);
      return;
    }
    
    const { source, destination, draggableId } = result;
    
    // Case 1: Left to Right (existing logic)
    if (source.droppableId.startsWith('left-section-') && destination.droppableId.startsWith('right-section-')) {
      handleLeftToRightMove(source, destination, draggableId);
    }
    // Case 2: Right to Right (NEW - reordering within section or moving between sections)
    else if (source.droppableId.startsWith('right-section-') && destination.droppableId.startsWith('right-section-')) {
      handleRightToRightMove(source, destination, draggableId);
    }
    // Case 3: Invalid drops (return to original position)
    else {
      // Force a re-render to ensure cards are properly restored
      setTimeout(() => {
        updateOrganizeState({ forceUpdate: Date.now() });
      }, 0);
    }
  };
  
  // If no book is selected, show a message
  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No book selected
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Please select a book from the sidebar to organize its cards.
          </p>
        </div>
      </div>
    );
  }

  // Check if all source sections have card_set_done as true
  const allSectionsReady = sections && sections.length > 0 && sections.every(section => section.card_set_done);
  
  // Show loading state while sections are being fetched
  if (!sections || sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sections...</p>
        </div>
      </div>
    );
  }
  
  if (!allSectionsReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Complete all card sets first
          </h2>
          <p className="text-gray-500 leading-relaxed">
            All source sections must have their card sets completed before you can organize cards. 
            Please go back to the Cards page and mark all sections as "Card Set Done".
          </p>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Sections that need completion:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {sections && sections.length > 0 ? (
                sections
                  .filter(section => !section.card_set_done)
                  .map(section => (
                    <li key={section.id} className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      {section.title}
                    </li>
                  ))
              ) : (
                <li className="text-yellow-600">Loading sections...</li>
              )}
            </ul>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Go Back to Cards Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full bg-white">
        {/* Left Half - Current Organization */}
        <div className="w-1/2 border-r border-gray-200 overflow-hidden">
          <OrganizeLeftPanel 
            organizeState={organizeState}
            updateOrganizeState={updateOrganizeState}
            addPendingCardMove={addPendingCardMove}
          />
        </div>
        
        {/* Right Half - New Organization */}
        <div className="w-1/2 overflow-hidden">
          <OrganizeRightPanel 
            organizeState={organizeState}
            updateOrganizeState={updateOrganizeState}
            addPendingCardMove={addPendingCardMove}
            addPendingSectionCreation={addPendingSectionCreation}
            addPendingSectionChange={addPendingSectionChange}
            addPendingSectionDeletion={addPendingSectionDeletion}
            loadInitialData={loadInitialData}
            handleSave={handleSave}
            sourceSections={organizeState.sourceSections}
            removeCardFromSection={removeCardFromSection}
          />
        </div>
      </div>
    </DragDropContext>
  );
};

export default Organize;
