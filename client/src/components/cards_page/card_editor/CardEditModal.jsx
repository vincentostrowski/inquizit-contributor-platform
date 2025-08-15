import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import CardTab from './CardTab';
import ContentTab from './ContentTab';
import QuizitTab from './QuizitTab';
import ImageReferenceSelector from './ImageReferenceSelector';

const CardEditModal = ({ card, isOpen, onClose, onSave, onDelete, selectedSection }) => {
  const [activeTab, setActiveTab] = useState('card'); // 'card', 'content', 'quizit'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    card_idea: '',
    prompt: '',
    content: '',
    order: '',
    banner: '',
    bannerFile: null
  });
  const [conversationLink, setConversationLink] = useState('');
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [contextPromptCopied, setContextPromptCopied] = useState(false);
  const [pendingPromptTests, setPendingPromptTests] = useState(null);
  // JSON panel state
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  // Update form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        card_idea: card.card_idea || '',
        prompt: card.prompt || '',
        content: card.content || '',
        order: card.order || '',
        banner: card.banner || '',
        bannerFile: null // Reset file when loading existing card
      });
      
      // Set the conversation link from card (either from existing card or from new card with section default)
      setConversationLink(card.conversationLink || '');

      // Reset JSON panel input/error when switching cards
      setJsonInput('');
      setJsonError(null);
      setJsonCopied(false);

      // Immediately clear drafts to prevent stale display while loading
      setPendingPromptTests(null);

      // Load persisted quizit tests for the saved prompt (if existing card)
      (async () => {
        try {
          if (!card.id || !card.prompt) {
            setPendingPromptTests(null);
            return;
          }
          const sha256 = async (text) => {
            const input = text || '';
            try {
              if (window?.crypto?.subtle) {
                const data = new TextEncoder().encode(input);
                const buf = await window.crypto.subtle.digest('SHA-256', data);
                return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
              }
              throw new Error('subtle crypto unavailable');
            } catch {
              let hash = 5381;
              for (let i = 0; i < input.length; i += 1) {
                hash = ((hash << 5) + hash) + input.charCodeAt(i);
                hash |= 0;
              }
              return (hash >>> 0).toString(16).padStart(8, '0');
            }
          };

          const promptHash = await sha256(card.prompt || '');
          const { data, error } = await supabase
            .from('card_prompt_tests')
            .select('slot, quizit, reasoning, feedback, confirmed')
            .eq('card_id', card.id)
            .eq('prompt_hash', promptHash)
            .order('slot', { ascending: true });

          if (error) {
            console.error('Failed to load prompt tests:', error);
            setPendingPromptTests(null);
            return;
          }

          const slots = { 0:{},1:{},2:{},3:{},4:{} };
          (data || []).forEach(row => {
            slots[row.slot] = {
              quizit: row.quizit || '',
              reasoning: row.reasoning || '',
              feedback: row.feedback || '',
              isTested: !!(row.quizit || row.reasoning),
              confirmed: !!row.confirmed
            };
          });
          setPendingPromptTests({ promptHash, slots });
        } catch (e) {
          console.error('Unexpected error loading prompt tests:', e);
          setPendingPromptTests(null);
        }
      })();
    }
  }, [card]);

  // Reset panel state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowLinkPanel(false);
      setShowJsonPanel(false);
      // Clear transient panel states on close
      setJsonInput('');
      setJsonError(null);
      setJsonCopied(false);
      setLinkInput('');
      // Clear any pending quizit drafts to avoid stale hydration on next open
      setPendingPromptTests(null);
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = (field) => {
    // Placeholder for future AI generation
  };

  const handleLinkClick = (link) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleEditLink = () => {
    if (showLinkPanel) {
      // Panel is open, close it
      setShowLinkPanel(false);
    } else {
      // Panel is closed, open it and pre-fill with current link
      setLinkInput(conversationLink || '');
      setShowJsonPanel(false);
      setShowLinkPanel(true);
    }
  };

  const handleToggleJsonPanel = () => {
    if (showJsonPanel) {
      setShowJsonPanel(false);
    } else {
      setShowLinkPanel(false);
      setJsonError(null);
      setShowJsonPanel(true);
    }
  };

  const buildContextPrompt = async () => {
    try {
      // Get the section ID from the selectedSection prop
      const sectionId = selectedSection?.id;
      
      if (!sectionId) {
        return "Error: No section context available.";
      }

      // Fetch all snippets for this section, ordered by creation time
      const { data: snippets, error } = await supabase
        .from('source_snippets')
        .select('content')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching snippets:', error);
        return "Error fetching section context.";
      }

      if (!snippets || snippets.length === 0) {
        return "No content available for this section.";
      }

      // Build the context prompt
      const sectionContent = snippets.map(s => s.content).join('\n\n');
      return sectionContent;
    } catch (error) {
      console.error('Error building context prompt:', error);
      return "Error fetching section context. Please try again.";
    }
  };

  const buildTitlePrompt = () => {
    let prompt = "Create the title for the concept card. The title must be less than 50 characters and should capture the core concept clearly.";
    
    if (formData.description?.trim()) {
      prompt += `\n\nDescription: ${formData.description}`;
    }
    
    if (formData.card_idea?.trim()) {
      prompt += `\n\nCard Idea: ${formData.card_idea}`;
    }
    
    return prompt;
  };

  const buildDescriptionPrompt = () => {
    let prompt = "Create the description for the concept card. The description must be between 100-130 characters and should explain the concept clearly. You can take into account the source content this card is derived from.";
    
    if (formData.title?.trim()) {
      prompt += `\n\nTitle: ${formData.title}`;
    }
    
    if (formData.card_idea?.trim()) {
      prompt += `\n\nCard Idea: ${formData.card_idea}`;
    }
    
    return prompt;
  };

  const buildBannerPrompt = () => {
    let prompt = "Generate a 25:9 landscape banner image for this concept card. The banner should contain only images/visual elements - no text whatsoever.";
    
    prompt += `\n\nIMPORTANT: Use the reference images provided below as your primary aesthetic guide. Study their visual style and apply these elements to your banner:`;
    prompt += `\n\n• Color Palette: Match the dominant colors, color temperature, and saturation levels`;
    prompt += `\n• Visual Style: Replicate the artistic style, texture, and rendering approach`;
    prompt += `\n• Composition: Use similar line weights, shapes, and spatial relationships`;
    prompt += `\n• Mood & Atmosphere: Capture the same emotional tone and visual feeling`;
    prompt += `\n• Technical Elements: Match lighting, shadows, depth, and perspective techniques`;
    
    prompt += `\n\nYour banner should feel like it belongs in the same visual family as these reference images, while being relevant to the card's content.`;
    
    if (formData.title?.trim()) {
      prompt += `\n\nCard Title: ${formData.title}`;
    }
    
    if (formData.description?.trim()) {
      prompt += `\n\nCard Description: ${formData.description}`;
    }
    
    if (formData.card_idea?.trim()) {
      prompt += `\n\nCard Concept: ${formData.card_idea}`;
    }
    
    prompt += `\n\nReference Images (study these for aesthetic guidance):`;
    
    return prompt;
  };

  const buildContentPrompt = () => {
    let prompt = "Create the main content for this concept card. This should use the support, elaboration and examples of the source text sent earlier. Aim to be as concise as possible and being self contained. This Content should not have to require outside context.";
    
    if (formData.title?.trim()) {
      prompt += `\n\nTitle: ${formData.title}`;
    }
    
    if (formData.description?.trim()) {
      prompt += `\n\nDescription: ${formData.description}`;
    }
    
    if (formData.card_idea?.trim()) {
      prompt += `\n\nCard Idea: ${formData.card_idea}`;
    }
    
    return prompt;
  };

  const copyPromptToClipboard = async (prompt, promptType) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(promptType);
      // prompt copied
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedPrompt(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  // Build JSON from current formData (fields only)
  const buildCardJson = () => {
    const exportObj = {
      title: formData.title || '',
      description: formData.description || '',
      card_idea: formData.card_idea || '',
      prompt: formData.prompt || '',
      content: formData.content || ''
    };
    return JSON.stringify(exportObj, null, 2);
  };

  // Apply JSON to formData (does not touch conversationLink)
  const handleApplyJson = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonError('Invalid JSON: expected an object');
        return;
      }
      const allowedKeys = ['title', 'description', 'card_idea', 'prompt', 'content'];
      const updates = {};
      for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(parsed, key)) {
          updates[key] = parsed[key] ?? '';
        }
      }
      setFormData(prev => ({
        ...prev,
        ...updates
      }));
    } catch (e) {
      setJsonError('Invalid JSON: ' + (e?.message || 'parse error'));
    }
  };


  const handleSave = () => {
    onSave({
      ...formData,
      conversationLink: conversationLink,
      pendingPromptTests
    });
    setShowLinkPanel(false); // Reset panel state
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && card?.id) {
      onDelete(card.id);
      setShowLinkPanel(false); // Reset panel state
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
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    setConversationLink(e.target.value);
                  }}
                  placeholder="https://claude.ai/chat/..."
                  className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                
                <button
                  onClick={async () => {
                    const prompt = await buildContextPrompt();
                    navigator.clipboard.writeText(prompt);
                    setContextPromptCopied(true);
                    setTimeout(() => setContextPromptCopied(false), 3000);
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center space-x-2 text-sm whitespace-nowrap"
                >
                  {contextPromptCopied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span>Context Prompt</span>
                </button>
                

              </div>
            </div>
          </div>
        )}
        {/* Slide-up JSON Panel */}
        {showJsonPanel && (
          <div className="bg-gray-100 border-b border-gray-200 p-6 flex-none">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Paste JSON to fill the card fields, or copy JSON of the current fields.</p>
              {jsonError && <p className="text-sm text-red-600 mt-2">{jsonError}</p>}
            </div>
            <div>
              <div className="flex items-start space-x-2">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"title": "...", "description": "...", "card_idea": "...", "prompt": "...", "content": "...", "banner": "...", "order": 1}'
                  className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[92px] resize-y"
                />
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(buildCardJson());
                        setJsonCopied(true);
                        setTimeout(() => setJsonCopied(false), 2000);
                      } catch (e) {
                        setJsonError('Failed to copy JSON');
                      }
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm whitespace-nowrap"
                  >
                    {jsonCopied ? 'Copied' : 'Copy JSON'}
                  </button>
        <button
                    onClick={handleApplyJson}
                    disabled={!jsonInput.trim()}
                    className={`px-3 py-2 rounded transition-colors text-sm whitespace-nowrap ${jsonInput.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
                    Apply JSON
        </button>
                </div>
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
          
          {/* Right side buttons - JSON, Conversation Link and Close */}
          <div className="flex items-center px-4 space-x-2">
            {/* JSON Button */}
            {card && (
              <button
                onClick={handleToggleJsonPanel}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  showJsonPanel ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
                title={showJsonPanel ? 'Close JSON panel' : 'Open JSON panel'}
              >
                JSON
              </button>
            )}
            {/* Conversation Link Button */}
            {card && (
              conversationLink ? (
                <>
                  <button
                    onClick={() => handleLinkClick(conversationLink)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Open Conversation
                  </button>
                  <button
                    onClick={handleEditLink}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      showLinkPanel 
                        ? 'bg-gray-500 text-white hover:bg-gray-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title={showLinkPanel ? "Close edit panel" : "Edit conversation link"}
                  >
                    {showLinkPanel ? '✕' : '✏️'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (showLinkPanel) {
                      // Panel is open, close it
                      setShowLinkPanel(false);
                    } else {
                      // Panel is closed, open it with empty input
                      setLinkInput('');
                      setShowLinkPanel(true);
                    }
                  }}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    showLinkPanel 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  {showLinkPanel ? 'Close' : 'Add Link'}
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
              buildTitlePrompt={buildTitlePrompt}
              buildDescriptionPrompt={buildDescriptionPrompt}
              buildBannerPrompt={buildBannerPrompt}
            />
          )}
          {activeTab === 'content' && (
            <ContentTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
              buildContentPrompt={buildContentPrompt}
            />
          )}
          {activeTab === 'quizit' && (
            <QuizitTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
              savedPrompt={card?.prompt || ''}
              cardId={card?.id}
              drafts={pendingPromptTests}
              onTestsDraftChange={setPendingPromptTests}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300 flex justify-between">
          <div className="flex space-x-3">
            {/* Delete button - only show for existing cards and when section card set is not complete */}
            {card?.id && !selectedSection?.card_set_done && (
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