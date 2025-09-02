import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { generateValidOrderings } from '../../../utils/dependencyUtils';
import CardTab from './CardTab';
import ContentTab from './ContentTab';
import QuizitTab from './QuizitTab';
import RelatedTab from './RelatedTab';

const initializeTestsStructure = () => {
  const tests = {};
  [0, 1, 2, 3, 4, 5].forEach(index => {
    tests[index] = { 
      quizit: '', 
      reasoning: '', 
      permutation: null, 
      themeInjection: null, 
      confirmed: false
    };
  });
  return tests;
};

const CardEditModal = ({ card, isOpen, onClose, onSave, onDelete, selectedSection, completionData, onCompletionUpdate }) => {
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
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success', 'error'
  // Selected permutations state - persists across tab switches
  const [selectedPermutations, setSelectedPermutations] = useState([]);
  
  // Quizit component structure state - persists across tab switches
  const [componentStructure, setComponentStructure] = useState({
    components: []
  });

  const [wordsToAvoid, setWordsToAvoid] = useState([]);

  const [themeInjections, setThemeInjections] = useState({
    theme_injections: []
  });

  const [tests, setTests] = useState(() => initializeTestsStructure());

  // Store original loaded data for reset functionality
  const [originalQuizitData, setOriginalQuizitData] = useState(null);

  // Flatten theme injections for database storage
  const flattenThemeInjections = (injections, parentId = null, level = 0, orderIndex = 0) => {
    const flattened = [];
    
    injections.forEach((injection, index) => {
      const currentOrderIndex = orderIndex + index;
      
      flattened.push({
        injection_id: injection.id.toString(),
        text: injection.text,
        tags: injection.tags,
        parent_id: parentId,
        level: level,
        order_index: currentOrderIndex
      });
      
      if (injection.children && injection.children.length > 0) {
        const children = flattenThemeInjections(injection.children, injection.id.toString(), level + 1, currentOrderIndex);
        flattened.push(...children);
      }
    });
    
    return flattened;
  };

  // Save theme injections to database
  const saveThemeInjections = async (cardId, themeInjectionsData) => {
    try {
      // First, delete existing theme injections for this card
      await supabase.from('theme_injections').delete().eq('card_id', cardId);
      
      // Then insert new ones
      const flattenedInjections = flattenThemeInjections(themeInjectionsData.theme_injections);
      
      if (flattenedInjections.length > 0) {
        const insertPromises = flattenedInjections.map(injection => 
          supabase.from('theme_injections').insert({
            card_id: cardId,
            injection_id: injection.injection_id,
            text: injection.text,
            tags: injection.tags,
            parent_id: injection.parent_id,
            level: injection.level,
            order_index: injection.order_index
          })
        );
        
        await Promise.all(insertPromises);
        console.log('Theme injections saved successfully');
      }
    } catch (error) {
      console.error('Error saving theme injections:', error);
      throw error;
    }
  };

  // Data saving function
  const saveQuizitData = async (cardId) => {
    try {
      // 1. Save card-level data
      await supabase.from('cards').update({
        words_to_avoid: wordsToAvoid.join(', '),
        quizit_component_structure: componentStructure,
        quizit_valid_permutations: selectedPermutations
      }).eq('id', cardId);

      // 2. Save theme injections
      if (themeInjections && themeInjections.theme_injections && themeInjections.theme_injections.length > 0) {
        await saveThemeInjections(cardId, themeInjections);
      }

      // 3. Save test data (delete + insert approach)
      try {
        // First, delete existing tests for this card
        await supabase.from('card_prompt_tests').delete().eq('card_id', cardId);
        
        // Then insert new tests
        const testPromises = [0, 1, 2, 3, 4, 5].map(slot => {
          const test = tests[slot];
          return supabase.from('card_prompt_tests').insert({
            card_id: cardId,
            slot: slot,
            quizit: test.quizit || '',
            reasoning: test.reasoning || '',
            permutation: test.permutation || null,
            theme_injection: test.themeInjection?.text || null,
            confirmed: test.confirmed || false
          });
        });

        await Promise.all(testPromises);
        console.log('Test data saved successfully');
      } catch (testError) {
        console.error('Error saving test data:', testError);
        // Continue with other saves even if tests fail
      }
      console.log('Quizit data saved successfully');
    } catch (error) {
      console.error('Error saving quizit data:', error);
      throw error;
    }
  };

  // Build nested theme injections from flat database structure
  const buildNestedThemeInjections = (flatInjections) => {
    const rootInjections = flatInjections.filter(inj => inj.level === 0);
    
    const buildChildren = (parentId) => {
      return flatInjections
        .filter(inj => inj.parent_id === parentId)
        .map(inj => ({
          id: inj.injection_id,
          text: inj.text,
          tags: inj.tags,
          children: buildChildren(inj.injection_id)
        }));
    };
    
    return {
      theme_injections: rootInjections.map(inj => ({
        id: parseInt(inj.injection_id),
        text: inj.text,
        tags: inj.tags,
        children: buildChildren(inj.injection_id)
      }))
    };
  };

  // Clear and map tests based on current dependencies
  const clearAndMapTests = (permutationsToUse = Array.isArray(selectedPermutations) ? selectedPermutations : [], themeInjectionsToUse = themeInjections) => {
    const clearedTests = initializeTestsStructure();
    
    // Map permutations to tests
    if (permutationsToUse && Array.isArray(permutationsToUse) && permutationsToUse.length > 0) {
      // Get the valid orderings to determine the display order
      const scenarioComponents = componentStructure?.components?.filter(comp => comp.type === 'scenario') || [];
      const { validOrderings } = generateValidOrderings(scenarioComponents, 10);
      
      // Sort selected permutations by their position in the validOrderings array
      const sortedPermutations = [...permutationsToUse].sort((a, b) => {
        const indexA = validOrderings.indexOf(a);
        const indexB = validOrderings.indexOf(b);
        return indexA - indexB;
      });
      
      // Distribute permutations evenly across all 6 tests
      const testsPerPermutation = 6 / sortedPermutations.length;
      
      sortedPermutations.forEach((permutation, permIndex) => {
        const startTestIndex = Math.floor(permIndex * testsPerPermutation);
        const endTestIndex = Math.floor((permIndex + 1) * testsPerPermutation);
        
        // Assign this permutation to its range of tests
        for (let testIndex = startTestIndex; testIndex < endTestIndex; testIndex++) {
          if (testIndex < 6) { // Safety check
            clearedTests[testIndex].permutation = permutation;
          }
        }
      });
    } else {
      // Clear all permutations when none are selected
      [0, 1, 2, 3, 4, 5].forEach(index => {
        clearedTests[index].permutation = null;
      });
    }
    
    // Map theme injections to tests
    if (themeInjectionsToUse && themeInjectionsToUse.theme_injections && themeInjectionsToUse.theme_injections.length > 0) {
      const rootScenarios = themeInjectionsToUse.theme_injections;
      let testIndex = 0;
      let childIndex = 0;
      
      while (testIndex < 6) {
        let foundChild = false;
        
        for (let rootIndex = 0; rootIndex < rootScenarios.length; rootIndex++) {
          const root = rootScenarios[rootIndex];
          
          if (root.children && root.children.length > childIndex) {
            const child = root.children[childIndex];
            clearedTests[testIndex].themeInjection = child;
            testIndex++;
            foundChild = true;
            
            if (testIndex >= 6) break;
          }
        }
        
        if (!foundChild) {
          childIndex++;
          
          let hasMoreChildren = false;
          for (let rootIndex = 0; rootIndex < rootScenarios.length; rootIndex++) {
            const root = rootScenarios[rootIndex];
            if (root.children && root.children.length > childIndex) {
              hasMoreChildren = true;
              break;
            }
          }
          
          if (!hasMoreChildren) break;
        }
      }
    } else {
      // Clear all theme injections when none are available
      [0, 1, 2, 3, 4, 5].forEach(index => {
        clearedTests[index].themeInjection = null;
      });
    }
    
    setTests(clearedTests);
  };

  // Wrapper function that sets selected permutations and clears tests
  const handleSelectedPermutationsChange = (newPermutations) => {
    setSelectedPermutations(newPermutations);
    clearAndMapTests(newPermutations); // Pass the new permutations directly
  };

  // Wrapper function that sets theme injections and clears tests
  const handleThemeInjectionsChange = (newThemeInjections) => {
    setThemeInjections(newThemeInjections);
    clearAndMapTests(selectedPermutations, newThemeInjections); // Pass both parameters directly
  };

  // Wrapper function that sets words to avoid and clears tests
  const handleWordsToAvoidChange = (newWordsToAvoid) => {
    setWordsToAvoid(newWordsToAvoid);
    clearAndMapTests(); // Use current selectedPermutations state
  };

  // Wrapper function that sets component structure and clears permutations + tests
  const handleComponentStructureChange = (newComponentStructure) => {
    setComponentStructure(newComponentStructure);
    setSelectedPermutations([]); // Clear selected permutations when components change
    clearAndMapTests([], themeInjections); // Clear tests with empty permutations
  };

  // Reset quizit data to original loaded state
  const handleResetQuizitData = () => {
    if (originalQuizitData) {
      setComponentStructure(originalQuizitData.componentStructure);
      setSelectedPermutations(originalQuizitData.selectedPermutations);
      setWordsToAvoid(originalQuizitData.wordsToAvoid);
      setThemeInjections(originalQuizitData.themeInjections);
      setTests(originalQuizitData.tests);
    }
  };

  // Data loading function
  const loadAllQuizitData = async (cardId) => {
    try {
      // Fetch card data, tests, and theme injections in parallel
      const [cardData, testsData, themeInjectionsData] = await Promise.all([
        supabase.from('cards').select('words_to_avoid, quizit_component_structure, quizit_valid_permutations').eq('id', cardId).single(),
        supabase.from('card_prompt_tests').select('*').eq('card_id', cardId).order('slot'),
        supabase.from('theme_injections').select('*').eq('card_id', cardId).order('level, order_index')
      ]);

      if (cardData.error) {
        console.error('Error loading card data:', cardData.error);
        return null;
      }

      if (testsData.error) {
        console.error('Error loading tests data:', testsData.error);
        return null;
      }

      if (themeInjectionsData.error) {
        console.error('Error loading theme injections data:', themeInjectionsData.error);
        return null;
      }

      // Transform the data
      const card = cardData.data;
      const tests = testsData.data || [];
      const themeInjections = themeInjectionsData.data || [];

      // Convert tests array to object format
      const testsObject = {};
      [0, 1, 2, 3, 4, 5].forEach(slot => {
        const testData = tests.find(t => t.slot === slot);
        testsObject[slot] = {
          quizit: testData?.quizit || '',
          reasoning: testData?.reasoning || '',
          permutation: testData?.permutation || null,
          themeInjection: testData?.theme_injection ? { text: testData.theme_injection } : null,
          confirmed: testData?.confirmed || false
        };
      });
      
      const loadedData = {
        wordsToAvoid: card.words_to_avoid ? card.words_to_avoid.split(',').map(w => w.trim()) : [],
        componentStructure: card.quizit_component_structure || { components: [] },
        selectedPermutations: Array.isArray(card.quizit_valid_permutations) ? card.quizit_valid_permutations : [],
        tests: testsObject,
        themeInjections: themeInjections.length > 0 ? buildNestedThemeInjections(themeInjections) : { theme_injections: [] }
      };
      
      return loadedData;
    } catch (error) {
      console.error('Error loading quizit data:', error);
      return null;
    }
  };

  // Load quizit data when card changes
  useEffect(() => {
    if (card?.id) {
      loadAllQuizitData(card.id).then(data => {
        if (data) {
          // Store original data for reset functionality
          setOriginalQuizitData(data);
          
          // Set all states at once to prevent cascading effects
          setComponentStructure(data.componentStructure);
          setSelectedPermutations(data.selectedPermutations);
          setWordsToAvoid(data.wordsToAvoid);
          setThemeInjections(data.themeInjections);
          setTests(data.tests);
        }
      });
    }
  }, [card?.id]);
  
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
    }
  }, [card]);

  // Handle field completion toggle
  const handleFieldCompletionToggle = (fieldName, isCompleted) => {
    setFieldCompletion(prev => ({
      ...prev,
      [fieldName]: isCompleted
    }));
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
      // Reset quizit-related states to empty
      setSelectedPermutations([]);
      setComponentStructure({ components: [] });
      setWordsToAvoid([]);
      setThemeInjections({ theme_injections: [] });
      setTests(initializeTestsStructure());
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
    let prompt = "You will be generating a 25:9 landscape banner image for a concept card. The banner should contain only images/visual elements - no text whatsoever.";
    
    prompt += `\n\nFirst, I need you to suggest 5 possible ideas, in detail, for the content of the banner (focus on what should be depicted, not style/aesthetic). Each idea should be a specific visual concept that represents the card's concept.`;
    
    prompt += `\n\nAfter I choose the best content idea, I will send you a reference image that you should use as a guide for the aesthetic and style when actually generating the banner.`;
    
    if (formData.title?.trim()) {
      prompt += `\n\nCard Title: ${formData.title}`;
    }
    
    if (formData.description?.trim()) {
      prompt += `\n\nCard Description: ${formData.description}`;
    }
    
    if (formData.card_idea?.trim()) {
      prompt += `\n\nCard Concept: ${formData.card_idea}`;
    }
    
    prompt += `\n\nPlease provide 5 detailed content ideas for the banner:`;
    
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
        // Save quizit data
        await saveQuizitData(savedCard.card.id);
      } else if (savedCard?.id) {
        await saveCompletionTracking(savedCard.id);
        // Save quizit data
        await saveQuizitData(savedCard.id);
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
              buildContentPrompt={buildContentPrompt}
              fieldCompletion={fieldCompletion}
              onFieldCompletionToggle={handleFieldCompletionToggle}
            />
          )}
          {activeTab === 'quizit' && (
            <QuizitTab 
              formData={formData}
              fieldCompletion={fieldCompletion}
              onFieldCompletionToggle={handleFieldCompletionToggle}
              selectedPermutations={selectedPermutations}
              setSelectedPermutations={handleSelectedPermutationsChange}
              componentStructure={componentStructure}
              setComponentStructure={handleComponentStructureChange}
              wordsToAvoid={wordsToAvoid}
              setWordsToAvoid={handleWordsToAvoidChange}
              themeInjections={themeInjections}
              setThemeInjections={handleThemeInjectionsChange}
              tests={tests}
              setTests={setTests}
              clearAndMapTests={clearAndMapTests}
              onResetQuizitData={handleResetQuizitData}
              hasOriginalData={!!originalQuizitData}
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