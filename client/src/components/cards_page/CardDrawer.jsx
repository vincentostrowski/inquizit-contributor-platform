import React, { useState, useEffect } from 'react';
import CardGrid from './CardGrid';
import ActionsList from './ActionsList';
import { supabase } from '../../services/supabaseClient';
import { useSections } from '../../hooks/useSections';
import { findNodeById } from '../../utils/treeUtils';

const CardDrawer = ({ selectedSection, onUpdateSection, book }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const { sections } = useSections(book);

  // Find the selected section from the processed sections data
  const sectionWithCompletion = selectedSection && sections.length > 0 
    ? findNodeById(sections, selectedSection.id) 
    : null;

  // Check if section is ready for card creation
  const isSectionReady = sectionWithCompletion?.sources_done && sectionWithCompletion?.completion?.percentage === 100;

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

  // Fetch cards when sectionWithCompletion changes
  useEffect(() => {
    const fetchCards = async () => {
      if (sectionWithCompletion) {
        setLoading(true);
        try {
          const sectionIds = getAllSectionIds(sectionWithCompletion);

          // Fetch cards that have source references pointing to the selected section or any of its descendants
          const { data: cardsData, error } = await supabase
            .from('cards')
            .select(`
              *,
              card_source_references!inner (
                id,
                created_at,
                source_section_id,
                source_snippet_id,
                char_start,
                char_end,
                card_id
              )
            `)
            .in('card_source_references.source_section_id', sectionIds)
            .order('order', { ascending: true });

          if (error) {
            console.error('Error fetching cards:', error);
            setCards([]);
          } else {
            setCards(cardsData || []);
          }
        } catch (error) {
          console.error('Error fetching cards:', error);
          setCards([]);
        } finally {
          setLoading(false);
        }
      } else {
        setCards([]);
      }
    };

    fetchCards();
  }, [sectionWithCompletion]);

  const handleCreateCard = () => {
    console.log('Create card clicked for section:', sectionWithCompletion?.id);
    // TODO: Implement card creation logic
  };

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
    // TODO: Implement card detail view
  };

  const handleActionSelect = (action) => {
    console.log('Action selected:', action);
    // TODO: Implement action handling
  };

  const handleConfirm = async () => {
    if (!sectionWithCompletion || !onUpdateSection) return;
    
    try {
      await onUpdateSection(sectionWithCompletion.id, { card_set_done: true });
    } catch (error) {
      console.error('Error confirming section:', error);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {sectionWithCompletion?.title || 'No section selected'}
          </h1>
          <div className="flex items-center space-x-2">
            {isSectionReady && (
              <>
                {cards.length === 0 && (
                  <button
                    onClick={() => {}}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <span>Generate</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                )}
                {!sectionWithCompletion?.card_set_done && cards.length > 0 && (
                  <button
                    onClick={handleConfirm}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm
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
            <div className="p-6 pr-0">
              <CardGrid 
                cards={cards} 
                onCardClick={handleCardClick}
                onCreateCard={handleCreateCard}
              />
            </div>
            {cards.length > 0 && (
              <div className="border-t border-gray-200 flex-1 min-h-0">
                <ActionsList onActionSelect={handleActionSelect} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDrawer; 