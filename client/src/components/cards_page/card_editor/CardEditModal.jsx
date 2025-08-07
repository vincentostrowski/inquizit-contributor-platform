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
  const [sectionLink, setSectionLink] = useState(null);
  const [fetchingSectionLink, setFetchingSectionLink] = useState(false);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkInput, setLinkInput] = useState('');

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
        
        // Fetch section link if card doesn't have one
        fetchSectionLink();
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

  const fetchSectionLink = async () => {
    if (!card?.id || card.snippet_chunks_for_context?.find(chunk => chunk.link)) {
      // Card already has a link, no need to fetch section link
      return;
    }

    setFetchingSectionLink(true);
    try {
      // Find any snippet_chunks_for_context that has a link for this section
      const { data, error } = await supabase
        .from('snippet_chunks_for_context')
        .select('link')
        .not('link', 'is', null)
        .eq('source_section_id', card.snippet_chunks_for_context?.[0]?.source_section_id)
        .limit(1)
        .single();

      if (!error && data?.link) {
        setSectionLink(data.link);
      }
    } catch (error) {
      console.error('Error fetching section link:', error);
    } finally {
      setFetchingSectionLink(false);
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
      <div className="w-11/12 h-5/6 max-w-7xl flex flex-col bg-gray-100 rounded-lg">
        {/* Slide-up Link Panel */}
        {showLinkPanel && (
          <div className="bg-gray-100 border-b border-gray-200 p-6 flex-none">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Paste the prompt into AI chatbot of your choice to give it the necessary context for generating better card content.
              </p>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://claude.ai/chat/..."
                  className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                
                <button
                  onClick={() => {
                    // TODO: Copy prompt to clipboard
                    console.log('Copy prompt functionality will be added');
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center space-x-2 text-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Prompt</span>
                </button>
                
                <button
                  onClick={async () => {
                    if (linkInput.trim()) {
                      if (card?.id) {
                        // Save to database for existing card
                        setSavingLink(true);
                        try {
                          const existingChunk = card.snippet_chunks_for_context?.find(chunk => chunk.card_id === card.id);
                          
                          if (existingChunk) {
                            const { error } = await supabase
                              .from('snippet_chunks_for_context')
                              .update({ link: linkInput.trim() })
                              .eq('id', existingChunk.id);
                            
                            if (error) throw error;
                          } else {
                            const { error } = await supabase
                              .from('snippet_chunks_for_context')
                              .insert({
                                card_id: card.id,
                                source_section_id: card.snippet_chunks_for_context?.[0]?.source_section_id || null,
                                source_snippet_id: null,
                                link: linkInput.trim()
                              });
                            
                            if (error) throw error;
                          }
                          
                          onSave(formData);
                        } catch (error) {
                          console.error('Error saving conversation link:', error);
                          alert('Failed to save conversation link. Please try again.');
                        } finally {
                          setSavingLink(false);
                        }
                      } else {
                        // Store in formData for new card
                        setFormData(prev => ({
                          ...prev,
                          conversationLink: linkInput.trim()
                        }));
                      }
                      
                      setLinkInput('');
                      setShowLinkPanel(false);
                    }
                  }}
                  disabled={!linkInput.trim() || savingLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {savingLink ? 'Saving...' : 'Save Link'}
                </button>
                
                <button
                  onClick={() => {
                    setLinkInput('');
                    setShowLinkPanel(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Modal Content */}
        <div className="flex flex-1 overflow-hidden">
        {/* Card Idea Section - Left Side */}
        <div className="w-80 bg-white rounded-l-lg flex flex-col border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <label className="font-medium text-sm">Card Idea</label>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Optional</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Additional context and direction included in the prompts to help generate better titles, descriptions, banners, and other card content.
            </p>
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={formData.card_idea}
              onChange={(e) => handleInputChange('card_idea', e.target.value)}
              className="flex-1 w-full p-3 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Enter additional context, direction, or clarification..."
            />
          </div>
        </div>

        {/* Original Modal Content */}
        <div className="bg-gray-100 rounded-r-lg flex-1 flex flex-col relative">

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
          
          {/* Right side buttons - Conversation Link and Close */}
          <div className="flex items-center px-4 space-x-2">
            {/* Conversation Link Button */}
            {card && (
              (card.snippet_chunks_for_context && card.snippet_chunks_for_context.filter(chunk => chunk.link).length > 0) || formData.conversationLink || sectionLink ? (
                <>
                                      <button
                      onClick={() => handleLinkClick(card.snippet_chunks_for_context?.find(chunk => chunk.link)?.link || formData.conversationLink || sectionLink)}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Open Conversation
                    </button>
                                      <button
                      onClick={() => {
                        const currentLink = card.snippet_chunks_for_context?.find(chunk => chunk.link)?.link || formData.conversationLink || sectionLink;
                        setLinkInput(currentLink || '');
                        setShowLinkPanel(true);
                      }}
                      className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit conversation link"
                    >
                      ✏️
                    </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setLinkInput('');
                    setShowLinkPanel(true);
                  }}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Add Link
                </button>
              )
            )}
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
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
      </div>
    </div>
  );
};

export default CardEditModal; 