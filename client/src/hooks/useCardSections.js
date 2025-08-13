import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const useCardSections = (book) => {
  const [cardSections, setCardSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch card sections when book changes
  useEffect(() => {
    if (book) {
      fetchCardSections();
    } else {
      setCardSections([]);
    }
  }, [book?.id]); // Use book.id instead of book object

  const fetchCardSections = async () => {
    if (!book) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch card sections from the card_sections table
      const { data: sections, error: sectionsError } = await supabase
        .from('card_sections')
        .select('*')
        .eq('book', book.id)
        .order('order', { ascending: true });

      if (sectionsError) {
        throw new Error(sectionsError.message);
      }

      // For each section, fetch the associated cards
      const sectionsWithCards = await Promise.all(
        (sections || []).map(async (section) => {
          const { data: cards, error: cardsError } = await supabase
            .from('cards')
            .select('id, title, description, card_idea, order, final_order, banner')
            .eq('section', section.id)
            .order('final_order', { ascending: true });

          if (cardsError) {
            return { ...section, cards: [], showDescription: true };
          }

          return { 
            ...section, 
            cards: cards || [], 
            showDescription: true,
            description: section.description || ''
          };
        })
      );

      setCardSections(sectionsWithCards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCardSection = async (title, description = '') => {
    if (!book) return null;

    try {
      // Get the next order value
      const maxOrder = cardSections.length > 0 
        ? Math.max(...cardSections.map(s => s.order || 0)) 
        : 0;
      
      const newOrder = maxOrder + 1;

      // Create new card section
      const { data: newSection, error } = await supabase
        .from('card_sections')
        .insert({
          title,
          description,
          book: book.id,
          order: newOrder
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add to local state
      const sectionWithDefaults = {
        ...newSection,
        cards: [],
        showDescription: true
      };
      
      setCardSections(prev => [...prev, sectionWithDefaults]);
      return sectionWithDefaults;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const updateCardSection = async (sectionId, updates) => {
    try {
      const { data: updatedSection, error } = await supabase
        .from('card_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setCardSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, ...updatedSection }
          : section
      ));

      return updatedSection;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const deleteCardSection = async (sectionId) => {
    try {
      // First, update all cards in this section to remove the section reference
      const { error: cardsError } = await supabase
        .from('cards')
        .update({ section: null })
        .eq('section', sectionId);

      if (cardsError) {
        // Continue with deletion even if card update fails
      }

      // Delete the section
      const { error } = await supabase
        .from('card_sections')
        .delete()
        .eq('id', sectionId);

      if (error) {
        throw new Error(error.message);
      }

      // Remove from local state
      setCardSections(prev => prev.filter(section => section.id !== sectionId));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const refreshCardSections = () => {
    if (book) {
      fetchCardSections();
    }
  };

  return {
    cardSections,
    loading,
    error,
    createCardSection,
    updateCardSection,
    deleteCardSection,
    refreshCardSections
  };
};
