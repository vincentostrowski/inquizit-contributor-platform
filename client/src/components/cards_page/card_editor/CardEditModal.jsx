import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import CardTab from './CardTab';
import ContentTab from './ContentTab';
import QuizitTab from './QuizitTab';

const CardEditModal = ({ card, isOpen, onClose, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState('card'); // 'card', 'content', 'quizit'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    card_idea: '',
    prompt: '',
    order: '',
    banner: ''
  });
  const [newConversationLink, setNewConversationLink] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  // Update form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        card_idea: card.card_idea || '',
        prompt: card.prompt || '',
        order: card.order || '',
        banner: card.banner || ''
      });
    }
  }, [card]);



  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = (field) => {
    // Mock generation - replace with actual AI call
    console.log(`Generating ${field}...`);
  };

  const handleLinkClick = (link) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleSaveConversationLink = async () => {
    if (!newConversationLink.trim() || !card?.id) return;
    
    setSavingLink(true);
    try {
      // Find existing snippet chunk for this card or create a new one
      const existingChunk = card.snippet_chunks_for_context?.find(chunk => chunk.card_id === card.id);
      
      if (existingChunk) {
        // Update existing chunk
        const { error } = await supabase
          .from('snippet_chunks_for_context')
          .update({ link: newConversationLink.trim() })
          .eq('id', existingChunk.id);
        
        if (error) throw error;
      } else {
        // Create new chunk
        const { error } = await supabase
          .from('snippet_chunks_for_context')
          .insert({
            card_id: card.id,
            source_section_id: null, // Will be set when card is associated with a section
            source_snippet_id: null,
            link: newConversationLink.trim()
          });
        
        if (error) throw error;
      }
      
      setNewConversationLink('');
      // Refresh the card data by calling onSave with current formData
      onSave(formData);
    } catch (error) {
      console.error('Error saving conversation link:', error);
      alert('Failed to save conversation link. Please try again.');
    } finally {
      setSavingLink(false);
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && card?.id) {
      onDelete(card.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 rounded-lg w-11/12 h-5/6 max-w-7xl flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          ×
        </button>
        
        {/* Card Idea Section */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <label className="font-medium">Card Idea</label>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Use this for additional direction or clarification if the description isn't enough. 
            This can be used to anchor further generations for titles, descriptions, and other card content.
          </p>
          <textarea
            value={formData.card_idea}
            onChange={(e) => handleInputChange('card_idea', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter additional context, direction, or clarification..."
            rows="3"
          />
        </div>



        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 relative">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-6 py-4 font-medium text-sm transition-all duration-200 relative ${
                activeTab === 'card' 
                  ? 'text-blue-600 bg-white border-b-2 border-blue-500 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Card
              {activeTab === 'card' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-4 font-medium text-sm transition-all duration-200 relative ${
                activeTab === 'content' 
                  ? 'text-blue-600 bg-white border-b-2 border-blue-500 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Content
              {activeTab === 'content' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quizit')}
              className={`px-6 py-4 font-medium text-sm transition-all duration-200 relative ${
                activeTab === 'quizit' 
                  ? 'text-blue-600 bg-white border-b-2 border-blue-500 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Quizit
              {activeTab === 'quizit' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
              )}
            </button>
          </div>
          
          {/* Conversation Link Button */}
          {card?.id && (
            <div className="flex items-center px-4 space-x-2">
              {card.snippet_chunks_for_context && card.snippet_chunks_for_context.filter(chunk => chunk.link).length > 0 ? (
                <>
                  <button
                    onClick={() => handleLinkClick(card.snippet_chunks_for_context.find(chunk => chunk.link)?.link)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Open Conversation
                  </button>
                  <button
                    onClick={async () => {
                      const currentLink = card.snippet_chunks_for_context.find(chunk => chunk.link)?.link;
                      const newLink = prompt('Edit conversation link:', currentLink);
                      if (newLink && newLink !== currentLink && card?.id) {
                        setSavingLink(true);
                        try {
                          const existingChunk = card.snippet_chunks_for_context.find(chunk => chunk.link);
                          if (existingChunk) {
                            const { error } = await supabase
                              .from('snippet_chunks_for_context')
                              .update({ link: newLink.trim() })
                              .eq('id', existingChunk.id);
                            
                            if (error) throw error;
                            onSave(formData);
                          }
                        } catch (error) {
                          console.error('Error updating conversation link:', error);
                          alert('Failed to update conversation link. Please try again.');
                        } finally {
                          setSavingLink(false);
                        }
                      }
                    }}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Edit conversation link"
                  >
                    ✏️
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    const link = prompt('Paste your conversation link:');
                    if (link && card?.id) {
                      setSavingLink(true);
                      try {
                        // Find existing snippet chunk for this card or create a new one
                        const existingChunk = card.snippet_chunks_for_context?.find(chunk => chunk.card_id === card.id);
                        
                        if (existingChunk) {
                          // Update existing chunk
                          const { error } = await supabase
                            .from('snippet_chunks_for_context')
                            .update({ link: link.trim() })
                            .eq('id', existingChunk.id);
                          
                          if (error) throw error;
                        } else {
                          // Create new chunk
                          const { error } = await supabase
                            .from('snippet_chunks_for_context')
                            .insert({
                              card_id: card.id,
                              source_section_id: null,
                              source_snippet_id: null,
                              link: link.trim()
                            });
                          
                          if (error) throw error;
                        }
                        
                        // Refresh the card data by calling onSave with current formData
                        onSave(formData);
                      } catch (error) {
                        console.error('Error saving conversation link:', error);
                        alert('Failed to save conversation link. Please try again.');
                      } finally {
                        setSavingLink(false);
                      }
                    }
                  }}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Add Link
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'card' && (
            <CardTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
            />
          )}
          {activeTab === 'content' && (
            <ContentTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
            />
          )}
          {activeTab === 'quizit' && <QuizitTab />}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300 flex justify-between">
          <div className="flex space-x-3">
            {/* Delete button - only show for existing cards */}
            {card?.id && (
              <button
                onClick={handleDelete}
                className="px-6 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                Delete Card
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {activeTab === 'quizit' && (
              <button className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
                Mark as Done
              </button>
            )}
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEditModal; 