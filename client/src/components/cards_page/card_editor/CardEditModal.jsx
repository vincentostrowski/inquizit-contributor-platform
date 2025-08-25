import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import CardTab from './CardTab';
import ContentTab from './ContentTab';
import QuizitTab from './QuizitTab';
import RelatedTab from './RelatedTab';
import ImageReferenceSelector from './ImageReferenceSelector';
import { generateQuizitHash } from '../../../utils/hashUtils';

// Field completion toggle component
const FieldCompletionToggle = ({ field, isCompleted, onToggle, label }) => (
  <div className="flex items-center space-x-2 mb-2">
    <button
      onClick={() => onToggle(field, !isCompleted)}
      className={`w-4 h-4 rounded border-2 transition-colors ${
        isCompleted 
          ? 'bg-green-500 border-green-500' 
          : 'bg-white border-gray-300 hover:border-gray-400'
      }`}
    >
      {isCompleted && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
    <span className="text-sm text-gray-600">
      Mark {label} as complete
    </span>
  </div>
);

const CardEditModal = ({ card, isOpen, onClose, onSave, onDelete, selectedSection, completionData, onCompletionUpdate }) => {
  const [activeTab, setActiveTab] = useState('card'); // 'card', 'content', 'quizit'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    card_idea: '',
    prompt: '',
    quizit_component_structure: '',
    quizit_valid_permutations: '',
    words_to_avoid: '',
    theme_injections: '',
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
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  
  // Selected permutations state - persists across tab switches
  const [selectedPermutations, setSelectedPermutations] = useState(new Set());
  
  // Completion tracking state - persists across tab changes
  const [fieldCompletion, setFieldCompletion] = useState({
    title: false,
    description: false,
    content: false,
    banner: false,
    quizit_configuration: false
  });

  // Update fieldCompletion when completionData changes
  useEffect(() => {
    if (completionData) {
      const newFieldCompletion = {
        title: !!completionData.title_completed,
        description: !!completionData.description_completed,
        content: !!completionData.content_completed,
        banner: !!completionData.banner_completed,
        quizit_configuration: !!completionData.quizit_configuration_completed
      };
      setFieldCompletion(newFieldCompletion);
    } else {
      setFieldCompletion({
        title: false,
        description: false,
        content: false,
        banner: false,
        quizit_configuration: false
      });
    }
  }, [completionData, card?.id]);

  // Update form data when card changes
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        card_idea: card.card_idea || '',
        prompt: card.prompt || '',
        quizit_component_structure: card.quizit_component_structure || '',
        quizit_valid_permutations: card.quizit_valid_permutations || '',
        words_to_avoid: card.words_to_avoid || '',
        theme_injections: card.theme_injections || '',
        content: card.content || '',
        order: card.order || '',
        banner: card.banner || '',
        bannerFile: null // Reset file when loading existing card
      });
      
      // Load selected permutations from saved data
      if (card.quizit_valid_permutations) {
        try {
          const savedPermutations = JSON.parse(card.quizit_valid_permutations);
          setSelectedPermutations(new Set(savedPermutations));
        } catch (error) {
          console.error('Error parsing saved permutations:', error);
          setSelectedPermutations(new Set());
        }
      } else {
        setSelectedPermutations(new Set());
      }
      
      // Set the conversation link from card (either from existing card or from new card with section default)
      setConversationLink(card.conversationLink || '');

      // Reset JSON panel input/error when switching cards
      setJsonInput('');
      setJsonError(null);
      setJsonCopied(false);

      // Immediately clear drafts to prevent stale display while loading
      setPendingPromptTests(null);

      // Load persisted quizit tests for the saved quizit fields (if existing card)
      (async () => {
        try {
          if (!card.id || (!card.quizit_component_structure && !card.words_to_avoid)) {
            setPendingPromptTests(null);
            return;
          }
          
          // Generate hash from the new quizit fields (same logic as save)
          const components = card.quizit_component_structure || '';
          const wordsToAvoid = card.words_to_avoid || '';
          const cardIdea = card.card_idea || '';
          const promptHash = generateQuizitHash(components, wordsToAvoid, cardIdea);
          const { data, error } = await supabase
            .from('card_prompt_tests')
            .select('slot, quizit, reasoning, confirmed, permutation')
            .eq('card_id', card.id)
            .eq('prompt_hash', promptHash)
            .order('slot', { ascending: true });

          if (error) {
            console.error('Failed to load prompt tests:', error);
            setPendingPromptTests(null);
            return;
          }

          const slots = { 0:{},1:{},2:{},3:{},4:{},5:{} };
          (data || []).forEach(row => {
            slots[row.slot] = {
              quizit: row.quizit || '',
              reasoning: row.reasoning || '',
              isTested: !!(row.quizit || row.reasoning),
              confirmed: !!row.confirmed,
              permutation: row.permutation || null
            };
          });
          setPendingPromptTests({ promptHash, slots });
        } catch (e) {
          console.error('Unexpected error loading prompt tests:', e);
          setPendingPromptTests(null);
        }
      })();

      // Load completion tracking for the card
      if (card.id) {
        // Completion tracking is now handled by the completionData prop
      } else {
        // For new cards, completion tracking will be initialized by the prop effect
      }
    }
  }, [card]);

  // Handle field completion toggle
  const handleFieldCompletionToggle = (fieldName, isCompleted) => {
    setFieldCompletion(prev => ({
      ...prev,
      [fieldName]: isCompleted
    }));
  };

  // Check if all fields are completed
  const areAllFieldsCompleted = () => {
    // For quizit_configuration, check if both quizit fields have content AND all 6 tests are completed/confirmed
    const quizitFieldsComplete = formData.quizit_component_structure && formData.words_to_avoid;
    
    // Check if all 6 tests are completed and confirmed (if we have pendingPromptTests)
    const allTestsCompleted = pendingPromptTests?.slots && 
      [0, 1, 2, 3, 4, 5].every(index => 
        pendingPromptTests.slots[index]?.isTested && pendingPromptTests.slots[index]?.confirmed
      );
    
    const quizitCompleted = quizitFieldsComplete && allTestsCompleted;
    
    const adjustedCompletion = {
      ...fieldCompletion,
      quizit_configuration: quizitCompleted
    };
    return Object.values(adjustedCompletion).every(completed => completed);
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    const totalFields = Object.keys(fieldCompletion).length;
    // For quizit_configuration, check if both quizit fields have content AND all 6 tests are completed/confirmed
    const quizitFieldsComplete = formData.quizit_component_structure && formData.words_to_avoid;
    
    // Check if all 6 tests are completed and confirmed (if we have pendingPromptTests)
    const allTestsCompleted = pendingPromptTests?.slots && 
      [0, 1, 2, 3, 4, 5].every(index => 
        pendingPromptTests.slots[index]?.isTested && pendingPromptTests.slots[index]?.confirmed
      );
    
    const quizitCompleted = quizitFieldsComplete && allTestsCompleted;
    
    const adjustedCompletion = {
      ...fieldCompletion,
      quizit_configuration: quizitCompleted
    };
    const completedFields = Object.values(adjustedCompletion).filter(completed => completed).length;
    return (completedFields / totalFields) * 100;
  };

  // Save completion tracking to database
  const saveCompletionTracking = async (cardId) => {
    try {
      // Calculate is_completed based on all individual fields
      const isCompleted = Object.values(fieldCompletion).every(completed => completed);
      
      // Always upsert (insert or update) completion tracking
      const { data, error } = await supabase
        .from('card_completion_tracking')
        .upsert({
          card_id: cardId,
          title_completed: fieldCompletion.title,
          description_completed: fieldCompletion.description,
          content_completed: fieldCompletion.content,
          banner_completed: fieldCompletion.banner,
          quizit_configuration_completed: fieldCompletion.quizit_configuration,
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'card_id'
        })
        .select();
      
      if (error) {
        console.error('Error saving completion tracking:', error);
        throw error;
      }
      
      // Notify parent component of the updated completion data
      if (onCompletionUpdate && data && data[0]) {
        onCompletionUpdate(cardId, data[0]);
      } else {
        // console.log('NOT calling onCompletionUpdate - missing data or callback');
      }
    } catch (error) {
      console.error('Error saving completion tracking:', error);
      throw error; // Re-throw to be handled by the save function
    }
  };

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
      // Reset completion tracking state when modal closes
      setFieldCompletion({
        title: false,
        description: false,
        content: false,
        banner: false,
        quizit_configuration: false
      });
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-uncheck completion if this field was marked complete and has changed
    if (fieldCompletion[field]) {
      setFieldCompletion(prev => ({
        ...prev,
        [field]: false
      }));
    }
    
    // For quizit configuration, uncheck if either quizit field changes
            if ((field === 'quizit_component_structure' || field === 'words_to_avoid') && fieldCompletion.quizit_configuration) {
      setFieldCompletion(prev => ({
        ...prev,
        quizit_configuration: false
      }));
    }
  };

  // Handle test confirmation changes (called from QuizitTab)
  const handleTestConfirmationChange = () => {
    // Auto-uncheck quizit configuration if it was marked complete but tests are no longer all confirmed
    if (fieldCompletion.quizit_configuration) {
      const allTestsCompleted = pendingPromptTests?.slots && 
        [0, 1, 2, 3, 4].every(index => 
          pendingPromptTests.slots[index]?.isTested && pendingPromptTests.slots[index]?.confirmed
        );
      
      if (!allTestsCompleted) {
        setFieldCompletion(prev => ({
          ...prev,
          quizit_configuration: false
        }));
      }
    }
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
      // prompt copied
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        // setCopiedPrompt(null); // This line was removed as per the edit hint
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
              quizit_component_structure: formData.quizit_component_structure || '',
      words_to_avoid: formData.words_to_avoid || '',
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
      const allowedKeys = ['title', 'description', 'card_idea', 'prompt', 'quizit_component_structure', 'words_to_avoid', 'content'];
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


  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const savedCard = await onSave({
        ...formData,
        conversationLink: conversationLink,
        pendingPromptTests
      });
      
      // Save completion tracking after card is saved
      if (savedCard?.card?.id) {
        await saveCompletionTracking(savedCard.card.id);
      } else if (savedCard?.id) {
        await saveCompletionTracking(savedCard.id);
      } else {
        // console.log('No savedCard.id found, skipping completion tracking save');
      }
      
      setShowLinkPanel(false); // Reset panel state
      setSaveStatus('success');
      // Auto-reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setSaveStatus('error');
      // Auto-reset error status after 5 seconds
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-11/12 h-5/6 max-w-7xl flex flex-col bg-gray-100 rounded-lg" onClick={(e) => e.stopPropagation()}>
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
                  placeholder='{"title": "...", "description": "...", "card_idea": "...", "prompt": "...", "quizit_component_structure": "...", "words_to_avoid": "...", "content": "...", "banner": "...", "order": 1}'
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
        <div className="bg-gray-100 rounded-r-lg flex-1 flex flex-col relative overflow-hidden">

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 relative">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-6 py-4 font-medium text-sm transition-all duration-100 relative ${
                activeTab === 'card' 
                  ? 'text-blue-600 bg-white shadow-sm' 
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
              className={`px-6 py-4 font-medium text-sm transition-all duration-100 relative ${
                activeTab === 'content' 
                  ? 'text-blue-600 bg-white shadow-sm' 
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
          className={`px-6 py-4 font-medium text-sm transition-all duration-100 relative ${
            activeTab === 'quizit' 
              ? 'text-blue-600 bg-white shadow-sm' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          Quizit
          {activeTab === 'quizit' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`px-6 py-4 font-medium text-sm transition-all duration-100 relative ${
            activeTab === 'related' 
              ? 'text-blue-600 bg-white shadow-sm' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          Related
          {activeTab === 'related' && (
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
              fieldCompletion={fieldCompletion}
              onFieldCompletionToggle={handleFieldCompletionToggle}
            />
          )}
          {activeTab === 'content' && (
            <ContentTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
              buildContentPrompt={buildContentPrompt}
              fieldCompletion={fieldCompletion}
              onFieldCompletionToggle={handleFieldCompletionToggle}
            />
          )}
          {activeTab === 'quizit' && (
            <QuizitTab 
              formData={formData}
              handleInputChange={handleInputChange}
              handleGenerate={handleGenerate}
              savedPrompt={{
                quizit_component_structure: card?.quizit_component_structure || '',
                words_to_avoid: card?.words_to_avoid || '',
                card_idea: card?.card_idea || '',
                quizit_valid_permutations: card?.quizit_valid_permutations || ''
              }}
              cardId={card?.id}
              drafts={pendingPromptTests}
              onTestsDraftChange={setPendingPromptTests}
              fieldCompletion={fieldCompletion}
              onFieldCompletionToggle={handleFieldCompletionToggle}
              onTestConfirmationChange={handleTestConfirmationChange}
              selectedPermutations={selectedPermutations}
              setSelectedPermutations={setSelectedPermutations}
            />
          )}
          {activeTab === 'related' && (
            <RelatedTab 
              card={card}
              formData={formData}
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
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Field status indicators */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(fieldCompletion).map(([field, completed]) => (
                <div key={field} className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="capitalize text-gray-600">
                    {field === 'quizit_configuration' ? 'Quizit Config' : field.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`px-6 py-2 rounded transition-colors ${
                saveStatus === 'saving' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveStatus === 'success'
                  ? 'bg-green-500 hover:bg-green-600'
                  : saveStatus === 'error'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 
               'Save'}
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