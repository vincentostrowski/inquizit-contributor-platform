import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import Card from '../cards_page/Card';

const OrganizeLeftPanel = ({ sections }) => {
  const [sectionCards, setSectionCards] = useState({});
  const [loading, setLoading] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('OrganizeLeftPanel received sections:', sections);
  }, [sections]);

  // Fetch cards for all sections
  useEffect(() => {
    const fetchAllSectionCards = async () => {
      if (!sections || sections.length === 0) {
        console.log('No sections to fetch cards for');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cardsBySection = {};

        // Fetch cards for each section
        for (const section of sections) {
          console.log(`Fetching cards for section: ${section.title} (ID: ${section.id})`);
          
          // Use the same logic as CardsPage - fetch cards through snippet_chunks_for_context
          const { data: cards, error } = await supabase
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
                .eq('source_section_id', section.id)
            ).data?.map(chunk => chunk.card_id) || [])
            .order('order', { ascending: true });

          if (!error && cards) {
            cardsBySection[section.id] = cards;
            console.log(`Found ${cards.length} cards for section ${section.title}`);
          } else {
            cardsBySection[section.id] = [];
            console.log(`No cards found for section ${section.title}`);
          }
        }

        console.log('Final cardsBySection:', cardsBySection);
        setSectionCards(cardsBySection);
      } catch (error) {
        console.error('Error fetching section cards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSectionCards();
  }, [sections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
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
        {sections.map((section) => {
          const cards = sectionCards[section.id] || [];
          
          return (
            <div key={section.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {/* Section Header - White background */}
              <div className="bg-white px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
              </div>
              
              {/* Cards Area - Gray background */}
              <div className="py-4">
                {cards.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-4">
                    {cards.map((card) => (
                      <Card 
                        key={card.id} 
                        card={card} 
                        onClick={() => {}} // No click handler for now
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No cards in this section</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrganizeLeftPanel;
