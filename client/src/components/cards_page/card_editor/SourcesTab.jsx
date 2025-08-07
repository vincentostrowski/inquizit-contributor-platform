import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';

const SourcesTab = ({ formData, handleInputChange, handleGenerate, card }) => {
  const [conversationLinks, setConversationLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch conversation links for this card
  useEffect(() => {
    const fetchConversationLinks = async () => {
      if (!card?.id) {
        setConversationLinks([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('snippet_chunks_for_context')
          .select(`
            *,
            source_sections!inner (
              id,
              title
            )
          `)
          .eq('card_id', card.id)
          .not('link', 'is', null);

        if (error) {
          console.error('Error fetching conversation links:', error);
          setConversationLinks([]);
        } else {
          setConversationLinks(data || []);
        }
      } catch (error) {
        console.error('Error fetching conversation links:', error);
        setConversationLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversationLinks();
  }, [card?.id]);

  const handleLinkClick = (link) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Conversation Links */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Links</h3>
        
        {loading ? (
          <div className="text-sm text-gray-500">Loading conversation links...</div>
        ) : conversationLinks.length > 0 ? (
          <div className="space-y-3">
            {conversationLinks.map((linkData) => (
              <div key={linkData.id} className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {linkData.source_sections?.title || 'Unknown Section'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {linkData.link}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLinkClick(linkData.link)}
                    className="ml-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No conversation links found for this card.
          </div>
        )}
      </div>


    </div>
  );
};

export default SourcesTab; 