import React, { useEffect, useRef, useState } from 'react';
import { generateValidOrderings } from '../../../utils/dependencyUtils';
import { supabase } from '../../../services/supabaseClient';
import { generateQuizitHash as generateQuizitHashUtil } from '../../../utils/hashUtils';
import { useThemeInjections } from './quizit/hooks/useThemeInjections';
import ThemeInjectionsLibrary from './quizit/components/ThemeInjectionsLibrary';

const QuizitTab = ({ formData, handleInputChange, handleGenerate, onTestsDraftChange, savedPrompt, drafts, cardId, fieldCompletion = {}, onFieldCompletionToggle, onTestConfirmationChange, selectedPermutations, setSelectedPermutations }) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testStates, setTestStates] = useState({
    0: { isTested: false, isConfirmed: false },
    1: { isTested: false, isConfirmed: false },
    2: { isTested: false, isConfirmed: false },
    3: { isTested: false, isConfirmed: false },
    4: { isTested: false, isConfirmed: false },
    5: { isTested: false, isConfirmed: false }
  });
  const [quizitComponentsPromptCopied, setQuizitComponentsPromptCopied] = useState(false);
  const [wordsPromptCopied, setWordsPromptCopied] = useState(false);
  const [themeInjectionsPromptCopied, setThemeInjectionsPromptCopied] = useState(false);
  const [quizitResults, setQuizitResults] = useState({
    0: { quizit: '', reasoning: '' },
    1: { quizit: '', reasoning: '' },
    2: { quizit: '', reasoning: '' },
    3: { quizit: '', reasoning: '' },
    4: { quizit: '', reasoning: '' },
    5: { quizit: '', reasoning: '' }
  });
  const [isTesting, setIsTesting] = useState(false);
  const [currentHash, setCurrentHash] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fieldsContentHash, setFieldsContentHash] = useState(null);

  // Theme Injections Library state
  const {
    selectedTag,
    expandedScenarios,
    showTags,
    tagSearchQuery,
    availableTags,
    filteredTags,
    filteredScenarios,
    setSelectedTag,
    setTagSearchQuery,
    setShowTags,
    toggleScenario,
    resetTagSearch,
    resetTagSelection
  } = useThemeInjections();



  const quizitRef = useRef(null);
  const reasoningRef = useRef(null);



  const lastLoadedHashRef = useRef(null);

  const autoGrowEl = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

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
      // Fallback: non-cryptographic hash (djb2) just to key rows predictably
      let hash = 5381;
      for (let i = 0; i < input.length; i += 1) {
        hash = ((hash << 5) + hash) + input.charCodeAt(i);
        hash |= 0; // force 32-bit
      }
      // Convert to hex string
      const hex = (hash >>> 0).toString(16).padStart(8, '0');
      return hex;
    }
  };

  // Generate hash from combined quizit fields using shared utility
  const generateQuizitHash = async () => {
    const components = formData?.quizit_component_structure || '';
    const wordsToAvoid = formData?.words_to_avoid || '';
    const cardIdea = formData?.card_idea || '';
    return generateQuizitHashUtil(components, wordsToAvoid, cardIdea);
  };

  // Generate permutations from component structure
  const generatePermutations = (componentStructure) => {
    if (!componentStructure) return { validOrderings: [], error: null };
    
    try {
      const parsed = JSON.parse(componentStructure);
      if (!parsed.components || !Array.isArray(parsed.components)) {
        return { validOrderings: [], error: null };
      }
      
      // Filter to only scenario components (type: 'scenario')
      const scenarioComponents = parsed.components.filter(comp => comp.type === 'scenario');
      
      if (scenarioComponents.length === 0) {
        return { validOrderings: [], error: 'No scenario components found' };
      }
      
      // Create a clean copy of scenario components with filtered dependencies
      const cleanScenarioComponents = scenarioComponents.map(comp => ({
        ...comp,
        prerequisites: comp.prerequisites && Array.isArray(comp.prerequisites)
          ? comp.prerequisites.filter(prereqId => {
              // Only keep prerequisites that reference scenario components
              const prereqComponent = parsed.components.find(c => c.id === prereqId);
              return prereqComponent && prereqComponent.type === 'scenario';
            })
          : []
      }));
      
      return generateValidOrderings(cleanScenarioComponents, 10); // Increased limit to show more permutations
    } catch (error) {
      return { validOrderings: [], error: `Error parsing components: ${error.message}` };
    }
  };

  // Handle permutation selection
  const handlePermutationSelect = (permutation) => {
    setSelectedPermutations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permutation)) {
        // Removing a permutation - clear tests that used it
        newSet.delete(permutation);
        
        // Clear tests that used the removed permutation
        const testsToClear = [];
        for (let testIndex = 0; testIndex < 6; testIndex++) {
          const testPermutation = quizitResults[testIndex]?.permutation;
          if (testPermutation === permutation) {
            testsToClear.push(testIndex);
          }
        }
        
        // Clear affected tests
        if (testsToClear.length > 0) {
          setQuizitResults(prevResults => {
            const updated = { ...prevResults };
            testsToClear.forEach(index => {
              updated[index] = { 
                quizit: '', 
                reasoning: '', 
                permutation: null
              };
            });
            return updated;
          });
          
          setTestStates(prevStates => {
            const updated = { ...prevStates };
            testsToClear.forEach(index => {
              updated[index] = { isTested: false, isConfirmed: false };
            });
            return updated;
          });
        }
      } else if (newSet.size < 3) {
        // Adding a permutation - no need to clear tests
        newSet.add(permutation);
      }
      return newSet;
    });
  };

  // Clear all selected permutations
  const clearSelectedPermutations = () => {
    setSelectedPermutations(new Set());
  };

  // Check if a permutation can be selected
  const canSelectPermutation = (permutation) => {
    return selectedPermutations.has(permutation) || selectedPermutations.size < 3;
  };

  // Get which permutation should be used for a specific test slot
  const getPermutationForTest = (testIndex, selectedPermutations, existingAssignments = null) => {
    // Get the full valid orderings array to preserve order
    const { validOrderings } = generatePermutations(formData?.quizit_component_structure || '');
    
    // Filter valid orderings to only include selected ones, preserving original order
    const orderedSelectedPermutations = validOrderings.filter(perm => selectedPermutations.has(perm));
    
    if (orderedSelectedPermutations.length === 0) return null;
    
    // If we have existing assignments and this test already has a valid one, keep it
    if (existingAssignments && existingAssignments[testIndex]?.permutation) {
      const existingPerm = existingAssignments[testIndex].permutation;
      if (orderedSelectedPermutations.includes(existingPerm)) {
        return existingPerm;
      }
    }
    
    const totalTests = 6;
    const permCount = orderedSelectedPermutations.length;
    
    let result;
    
    if (permCount === 1) {
      // All 6 tests use the same permutation
      result = orderedSelectedPermutations[0];
    } else if (permCount === 2) {
      // First permutation in valid orderings gets first 3 tests, second gets last 3 tests
      result = testIndex < 3 ? orderedSelectedPermutations[0] : orderedSelectedPermutations[1];
    } else if (permCount === 3) {
      // First permutation gets tests 0,1, second gets tests 2,3, third gets tests 4,5
      result = orderedSelectedPermutations[Math.floor(testIndex / 2)];
    } else {
      // 4+ permutations: first gets extra, others get minimum 2
      const baseTestsPerPerm = Math.floor(totalTests / permCount);
      const extraTests = totalTests % permCount;
      
      if (testIndex < (baseTestsPerPerm + extraTests)) {
        result = orderedSelectedPermutations[0];
      } else {
        const permIndex = Math.floor((testIndex - (baseTestsPerPerm + extraTests)) / baseTestsPerPerm) + 1;
        result = orderedSelectedPermutations[permIndex] || orderedSelectedPermutations[0]; // fallback
      }
    }
    
    return result;
  };

  // Get color for permutation based on its index in the selected set
  const getPermutationColor = (permutation, selectedPermutations) => {
    const permutations = Array.from(selectedPermutations);
    const permIndex = permutations.indexOf(permutation);
    
    const colors = [
      'text-red-400',    // First permutation - Lighter Red
      'text-yellow-500', // Second permutation - Lighter Yellow
      'text-blue-400',   // Third permutation - Lighter Blue
      'text-green-400',  // Fourth permutation - Lighter Green
      'text-purple-400', // Fifth permutation - Lighter Purple
      'text-orange-400'  // Sixth permutation - Lighter Orange
    ];
    
    return colors[permIndex] || 'text-gray-400';
  };

  // Reorder components based on permutation string
  const reorderComponentsByPermutation = (components, permutation) => {
    if (!permutation || !components) return components;
    
    const permOrder = permutation.split(' ');
    const reordered = permOrder.map(permId => 
      components.find(c => c.id === permId)
    ).filter(Boolean);
    
    return reordered.length > 0 ? reordered : components;
  };





  // Sync selected permutations to formData when they change
  useEffect(() => {
    const selectedArray = Array.from(selectedPermutations);
    handleInputChange('quizit_valid_permutations', JSON.stringify(selectedArray));
  }, [selectedPermutations]); // Remove handleInputChange from dependencies to avoid infinite loop

  // Clear all tests when permutations change
  useEffect(() => {
    if (selectedPermutations.size > 0) {
      // Clear all tests when permutations change
      const clearedResults = {};
      const clearedStates = {};
      
      [0,1,2,3,4,5].forEach(index => {
        clearedResults[index] = { 
          quizit: '', 
          reasoning: '', 
          permutation: null
        };
        clearedStates[index] = { isTested: false, isConfirmed: false };
      });
      
      setQuizitResults(clearedResults);
      setTestStates(clearedStates);
      
      // Emit the cleared state to parent so it can be saved
      emitDraftChange(currentHash, clearedResults, clearedStates);
    }
  }, [selectedPermutations]);

  // Clean up stale permutations when component structure changes
  useEffect(() => {
    if (selectedPermutations.size > 0) {
      const { validOrderings } = generatePermutations(formData?.quizit_component_structure || '');
      
      // Remove any selected permutations that are no longer valid
      const validSelectedPermutations = Array.from(selectedPermutations).filter(perm => 
        validOrderings.includes(perm)
      );
      
      if (validSelectedPermutations.length !== selectedPermutations.size) {
        setSelectedPermutations(new Set(validSelectedPermutations));
      }
    }
  }, [formData?.quizit_component_structure]);

  // Handle component deletion
  const handleComponentDelete = (componentIndex) => {
    try {
      const parsed = JSON.parse(formData.quizit_component_structure);
      if (!parsed.components || !Array.isArray(parsed.components)) return;
      
      // Remove the component at the specified index
      const newComponents = parsed.components.filter((_, i) => i !== componentIndex);
      
      // Reassign IDs to maintain A, B, C... order
      const reorderedComponents = newComponents.map((comp, i) => ({
        ...comp,
        id: String.fromCharCode(65 + i) // A, B, C, D...
      }));
      
      // Update the component structure
      const newStructure = { ...parsed, components: reorderedComponents };
      handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
      
      // Clear all tests since permutation assignments will change
      const clearedResults = {};
      const clearedStates = {};
      
      [0,1,2,3,4,5].forEach(index => {
        clearedResults[index] = { 
          quizit: '', 
          reasoning: '', 
          permutation: null
        };
        clearedStates[index] = { isTested: false, isConfirmed: false };
      });
      
      setQuizitResults(clearedResults);
      setTestStates(clearedStates);
      
      // Emit the cleared state to parent so it can be saved
      emitDraftChange(currentHash, clearedResults, clearedStates);
    } catch (error) {
      console.error('Error deleting component:', error);
    }
  };

  // Handle component type toggle
  const handleComponentTypeToggle = (componentIndex) => {
    try {
      const parsed = JSON.parse(formData.quizit_component_structure);
      if (!parsed.components || !Array.isArray(parsed.components)) return;
      
              // Toggle the component type between 'scenario' and 'reasoning'
        const newComponents = [...parsed.components];
        newComponents[componentIndex].type = newComponents[componentIndex].type === 'scenario' ? 'reasoning' : 'scenario';
      
      // Update the component structure
      const newStructure = { ...parsed, components: newComponents };
      handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
      
      // Clear all tests since component types changed
      const clearedResults = {};
      const clearedStates = {};
      
      [0,1,2,3,4,5].forEach(index => {
        clearedResults[index] = { 
          quizit: '', 
          reasoning: '', 
          permutation: null
        };
        clearedStates[index] = { isTested: false, isConfirmed: false };
      });
      
      setQuizitResults(clearedResults);
      setTestStates(clearedStates);
      
      // Emit the cleared state to parent so it can be saved
      emitDraftChange(currentHash, clearedResults, clearedStates);
    } catch (error) {
      console.error('Error toggling component type:', error);
    }
  };

  // Handle adding new component
  const handleAddComponent = () => {
    try {
      const parsed = JSON.parse(formData.quizit_component_structure);
      if (!parsed.components || !Array.isArray(parsed.components)) return;
      
      // Get the next available letter ID
      const nextId = String.fromCharCode(65 + parsed.components.length); // A, B, C, D...
      
      // Create new component
      const newComponent = {
                           id: nextId,
                   text: '',
                   type: 'scenario', // Default to Scenario Components
                   isPrerequisite: false,
                   prerequisites: []
      };
      
      // Add to components array
      const newComponents = [...parsed.components, newComponent];
      const newStructure = { ...parsed, components: newComponents };
      handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
      
      // Clear all tests since permutation assignments will change
      const clearedResults = {};
      const clearedStates = {};
      
      [0,1,2,3,4,5].forEach(index => {
        clearedResults[index] = { 
          quizit: '', 
          reasoning: '', 
          permutation: null
        };
        clearedStates[index] = { isTested: false, isConfirmed: false };
      });
      
      setQuizitResults(clearedResults);
      setTestStates(clearedStates);
      
      // Emit the cleared state to parent so it can be saved
      emitDraftChange(currentHash, clearedResults, clearedStates);
      
      // Focus the new component's textarea after a brief delay to allow re-render
      setTimeout(() => {
        const newComponentTextarea = document.querySelector(`textarea[data-component-id="${nextId}"]`);
        if (newComponentTextarea) {
          newComponentTextarea.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error adding component:', error);
    }
  };

  // Parse words to avoid text into array
  const parseWordsToAvoid = (text) => {
    if (!text || text.trim().length === 0) return [];
    
    // Split by newlines and commas, preserve empty strings for UI editing
    return text
      .split(/[\n,]+/)
      .map(word => word.trim());
  };

  // Parse theme injections text into array
  const parseThemeInjections = (text) => {
    if (!text || text.trim().length === 0) return [];
    
    // Split by newlines and commas, preserve empty strings for UI editing
    return text
      .split(/[\n,]+/)
      .map(injection => injection.trim());
  };



  // Handle adding new word to avoid
  const handleAddWordToAvoid = () => {
    try {
      const currentWords = parseWordsToAvoid(formData.words_to_avoid || '');
      const newWords = [...currentWords, ''];
      const newText = newWords.join('\n');
      handleInputChange('words_to_avoid', newText);
      
      // Focus the new word's textarea after a brief delay
      setTimeout(() => {
        const newWordTextarea = document.querySelector(`textarea[data-word-id="${newWords.length - 1}"]`);
        if (newWordTextarea) {
          newWordTextarea.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error adding word to avoid:', error);
    }
  };

  // Handle deleting word to avoid
  const handleDeleteWordToAvoid = (wordIndex) => {
    try {
      const currentWords = parseWordsToAvoid(formData.words_to_avoid || '');
      const newWords = currentWords.filter((_, i) => i !== wordIndex);
      const newText = newWords.join('\n');
      handleInputChange('words_to_avoid', newText);
    } catch (error) {
      console.error('Error deleting word to avoid:', error);
    }
  };

  // Handle adding new theme injection
  const handleAddThemeInjection = () => {
    try {
      const currentInjections = parseThemeInjections(formData.theme_injections || '');
      const newInjections = [...currentInjections, ''];
      const newText = newInjections.join('\n');
      handleInputChange('theme_injections', newText);
      
      // Focus the new injection's textarea after a brief delay
      setTimeout(() => {
        const newInjectionTextarea = document.querySelector(`textarea[data-theme-injection-id="${newInjections.length - 1}"]`);
        if (newInjectionTextarea) {
          newInjectionTextarea.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error adding theme injection:', error);
    }
  };

  // Handle deleting theme injection
  const handleDeleteThemeInjection = (injectionIndex) => {
    try {
      const currentInjections = parseThemeInjections(formData.theme_injections || '');
      const newInjections = currentInjections.filter((_, i) => i !== injectionIndex);
      const newText = newInjections.join('\n');
      handleInputChange('theme_injections', newText);
    } catch (error) {
      console.error('Error deleting theme injection:', error);
    }
  };

  // Handle copying theme injections prompt
  const handleCopyThemeInjectionsPrompt = () => {
    // Build predefined instructions + card JSON
    const cardJson = {
      card: {
        title: formData?.title || '',
        description: formData?.description || '',
        card_idea: formData?.card_idea || ''
      },
      content: formData?.content || ''
    };
    
    const instructions = `You are given a concept card and its explanation. Generate a collection of workplace scenario components that could be used to test understanding of this concept.

Each scenario should be:
- A concrete, realistic workplace situation
- Relevant to the concept being tested
- General enough to apply to various industries
- Specific enough to be engaging and relatable

For example, if testing for 'confirmation bias', scenarios could include:
- A manager evaluating job candidates and focusing on information that confirms their initial impression
- A team member researching solutions and only seeking sources that support their preferred approach
- A project manager reviewing feedback and dismissing criticism that contradicts their plan

Return your response as a simple list, one scenario per line:
[scenario 1]
[scenario 2]
[scenario 3]
...`;
    
    const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
    navigator.clipboard.writeText(payload);
    setThemeInjectionsPromptCopied(true);
    setTimeout(() => setThemeInjectionsPromptCopied(false), 2000);
  };

  // Handle resetting theme injections
  const handleResetThemeInjections = () => {
    handleInputChange('theme_injections', '');
  };

  // Clear all tests and selected permutations when dependencies change (component structure changes)
  useEffect(() => {
    if (formData?.quizit_component_structure) {
      // Check if this is the initial load by comparing with the last loaded hash
      const currentStructureHash = JSON.stringify(formData.quizit_component_structure);
      
      if (lastLoadedHashRef.current && lastLoadedHashRef.current !== currentStructureHash) {
        // This is an actual change, not initial load
        
        // Clear all tests when component structure changes
        const clearedResults = {};
        const clearedStates = {};
        
        [0,1,2,3,4,5].forEach(index => {
          clearedResults[index] = { 
            quizit: '', 
            reasoning: '', 
            permutation: null
          };
          clearedStates[index] = { isTested: false, isConfirmed: false };
        });
        
        setQuizitResults(clearedResults);
        setTestStates(clearedStates);
        
        // Clear selected permutations since the dependency graph may have changed
        setSelectedPermutations(new Set());
        
        // Also clear the parent's quizit_valid_permutations field
        handleInputChange('quizit_valid_permutations', '[]');
        
        // Emit the cleared state to parent so it can be saved
        emitDraftChange(currentHash, clearedResults, clearedStates);
      } else {
        // Store the hash for future comparisons
        lastLoadedHashRef.current = currentStructureHash;
      }
    }
  }, [formData?.quizit_component_structure]);







  const emitDraftChange = (hash = currentHash, localResults = quizitResults, localStates = testStates) => {
    // Don't emit if we don't have a valid hash (unless we're explicitly clearing tests)
    if (!hash) {
      return;
    }
    
    if (!onTestsDraftChange) return;
    const slots = {};
    [0,1,2,3,4,5].forEach(i => {
      const r = localResults[i] || { quizit: '', reasoning: '', permutation: null };
      const s = localStates[i] || { isTested: false, isConfirmed: false };
      slots[i] = {
        quizit: r.quizit || '',
        reasoning: r.reasoning || '',

        permutation: r.permutation || null,
        isTested: !!s.isTested,
        confirmed: !!s.isConfirmed
      };
    });
    onTestsDraftChange({ promptHash: hash, slots });
  };

  // Check if all tests are completed and confirmed
  const areAllTestsConfirmed = () => {
    // Use parent state (drafts) if available, otherwise fall back to local state
    if (drafts?.slots) {
      return [0, 1, 2, 3, 4, 5].every(index => 
        drafts.slots[index]?.isTested && drafts.slots[index]?.confirmed
      );
    }
    // Fallback to local state
    return [0, 1, 2, 3, 4, 5].every(index => 
      testStates[index]?.isTested && testStates[index]?.confirmed
    );
  };

  // Hydrate local state from parent drafts (persists across tab switches)
  useEffect(() => {
    if (!drafts) return;
    
    // If drafts has a promptHash or any slot content, hydrate
    const hasAny = !!drafts.promptHash || [0,1,2,3,4,5].some(i => {
      const s = drafts.slots?.[i];
      return s && (s.quizit || s.reasoning || s.isTested || s.confirmed);
    });
    
    if (!hasAny) return;

    
    const nextStates = {
      0: { isTested: !!drafts.slots?.[0]?.isTested, isConfirmed: !!drafts.slots?.[0]?.confirmed },
      1: { isTested: !!drafts.slots?.[1]?.isTested, isConfirmed: !!drafts.slots?.[1]?.confirmed },
      2: { isTested: !!drafts.slots?.[2]?.isTested, isConfirmed: !!drafts.slots?.[2]?.confirmed },
      3: { isTested: !!drafts.slots?.[3]?.isTested, isConfirmed: !!drafts.slots?.[3]?.confirmed },
      4: { isTested: !!drafts.slots?.[4]?.isTested, isConfirmed: !!drafts.slots?.[4]?.confirmed },
      5: { isTested: !!drafts.slots?.[5]?.isTested, isConfirmed: !!drafts.slots?.[5]?.confirmed },
    };
    const nextResults = {
        0: { quizit: drafts.slots?.[0]?.quizit || '', reasoning: drafts.slots?.[0]?.reasoning || '', permutation: drafts.slots?.[0]?.permutation || null },
        1: { quizit: drafts.slots?.[1]?.quizit || '', reasoning: drafts.slots?.[1]?.reasoning || '', permutation: drafts.slots?.[1]?.permutation || null },
        2: { quizit: drafts.slots?.[2]?.quizit || '', reasoning: drafts.slots?.[2]?.reasoning || '', permutation: drafts.slots?.[2]?.permutation || null },
        3: { quizit: drafts.slots?.[3]?.quizit || '', reasoning: drafts.slots?.[3]?.reasoning || '', permutation: drafts.slots?.[3]?.permutation || null },
        4: { quizit: drafts.slots?.[4]?.quizit || '', reasoning: drafts.slots?.[4]?.reasoning || '', permutation: drafts.slots?.[4]?.permutation || null },
        5: { quizit: drafts.slots?.[5]?.quizit || '', reasoning: drafts.slots?.[5]?.reasoning || '', permutation: drafts.slots?.[5]?.permutation || null },
      };
    
    setCurrentHash(drafts.promptHash || null);
    setTestStates(nextStates);
    setQuizitResults(nextResults);
    setHasHydrated(true);
    
    // Set initial fields content hash after hydration
    const components = formData?.quizit_component_structure ?? '';
    const wordsToAvoid = formData?.words_to_avoid ?? '';
    const initialHash = `${components}|${wordsToAvoid}`;
    setFieldsContentHash(initialHash);
    
    
  }, [drafts]);



  const handleTestClick = async (index) => {
    if (!formData?.quizit_component_structure || !formData?.words_to_avoid || isTesting) return;
    
    // Get permutation for this test slot
    const permutation = getPermutationForTest(index, selectedPermutations);
    if (!permutation) {
      alert('No valid permutation available for this test');
      setIsTesting(false);
      return;
    }
    
    setIsTesting(true);
    try {
      let hash = currentHash;
      if (!hash) {
        hash = await generateQuizitHash();
        setCurrentHash(hash);
      }
      
      // Parse the structured components and separate by type
      let scenarioComponents = '';
      let reasoningComponents = '';
      try {
        const parsed = JSON.parse(formData.quizit_component_structure);
        if (parsed.components && Array.isArray(parsed.components)) {
          // Filter to scenario and reasoning components
          const scenarioComps = parsed.components.filter(comp => comp.type === 'scenario');
          const reasoningComps = parsed.components.filter(comp => comp.type === 'reasoning');
          
          if (scenarioComps.length === 0) {
            alert('No scenario components found. Please add at least one scenario component.');
            setIsTesting(false);
            return;
          }
          
          // Reorder scenario components based on permutation
          const reorderedScenarioComps = reorderComponentsByPermutation(scenarioComps, permutation);
          scenarioComponents = reorderedScenarioComps.map(c => c.text).join('\n');
          
          // Get reasoning components (no reordering needed)
          reasoningComponents = reasoningComps.map(c => c.text).join('\n');
        } else {
          throw new Error('Invalid component structure');
        }
      } catch (parseError) {
        alert('Invalid component structure. Please check your JSON format.');
        setIsTesting(false);
        return;
      }
      
      const wordsToAvoid = formData.words_to_avoid || '';
      const combinedContent = `Scenario Components:\n${scenarioComponents}\n\nReasoning Components:\n${reasoningComponents}\n\nWords to Avoid:\n${wordsToAvoid}\n\nCard Idea:\n${formData.card_idea || ''}`;
      
      // Step 1: Generate scenario
      const { data: scenarioData, error: scenarioError } = await supabase.functions.invoke('quizit-scenario', {
        body: { 
          scenarioComponents: scenarioComponents,
          wordsToAvoid: formData.words_to_avoid || ''
        }
      });
      
      if (scenarioError) {
        console.error('Error generating scenario:', scenarioError);
        alert('Failed to generate scenario. Please try again.');
        return;
      }
      
      console.log('Scenario response:', scenarioData);
      
      // Step 2: Generate reasoning using the scenario
      const reasoningBody = { 
        scenarioComponents: scenarioComponents,
        reasoningComponents: reasoningComponents,
        cardIdea: formData.card_idea || '',
        generatedQuizit: scenarioData
      };
      
      console.log('Sending to quizit-reasoning:', reasoningBody);
      
      const { data: reasoningData, error: reasoningError } = await supabase.functions.invoke('quizit-reasoning', {
        body: reasoningBody
      });
      
      if (reasoningError) {
        console.error('Error generating reasoning:', reasoningError);
        alert('Failed to generate reasoning. Please try again.');
        return;
      }
      
      const { quizit = '', reasoning = '' } = { 
        quizit: scenarioData, 
        reasoning: reasoningData 
      };
      // Store permutation with test results
      setQuizitResults(prev => ({
        ...prev,
        [index]: { quizit, reasoning, permutation }
      }));
      setTestStates(prev => ({
        ...prev,
        [index]: { ...prev[index], isTested: true }
      }));
      // Emit aggregated drafts upward for save-time persistence
      const localResults = {
        ...quizitResults,
        [index]: { quizit, reasoning, permutation }
      };
      const localStates = {
        ...testStates,
        [index]: { ...testStates[index], isTested: true }
      };
      emitDraftChange(hash, localResults, localStates);
    } catch (e) {
      console.error('Unexpected error generating quizit:', e);
      alert('Unexpected error. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleConfirmTest = (index) => {
    setTestStates(prev => ({
      ...prev,
      [index]: { ...prev[index], isConfirmed: true }
    }));
    const localStates = {
      ...testStates,
      [index]: { ...testStates[index], isConfirmed: true }
    };
    emitDraftChange(currentHash, quizitResults, localStates);
    
    // Notify parent component about test confirmation change
    if (onTestConfirmationChange) {
      onTestConfirmationChange();
    }
  };

  const getTestStatus = (index) => {
    const test = testStates[index];
    if (test.isConfirmed) return 'confirmed';
    if (test.isTested) return 'tested';
    return 'untested';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'tested':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'untested':
        return 'bg-gray-100 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const getStatusText = () => '';

  // Track field content changes to detect when tests should reset
  useEffect(() => {
    if (!hasHydrated) return;
    
    const components = formData?.quizit_component_structure ?? '';
    const wordsToAvoid = formData?.words_to_avoid ?? '';
    const newHash = `${components}|${wordsToAvoid}`; // Simple string comparison for now
    
    // Only update if it's actually different
    if (newHash !== fieldsContentHash) {
      // If we had previous content (not initial load), clear tests
      if (fieldsContentHash !== null) {

        const clearedStates = {
          0: { isTested: false, isConfirmed: false },
          1: { isTested: false, isConfirmed: false },
          2: { isTested: false, isConfirmed: false },
          3: { isTested: false, isConfirmed: false },
          4: { isTested: false, isConfirmed: false },
          5: { isTested: false, isConfirmed: false }
        };
        const clearedResults = {
          0: { quizit: '', reasoning: '' },
          1: { quizit: '', reasoning: '' },
          2: { quizit: '', reasoning: '' },
          3: { quizit: '', reasoning: '' },
          4: { quizit: '', reasoning: '' },
          5: { quizit: '', reasoning: '' }
        };
        setTestStates(clearedStates);
        setQuizitResults(clearedResults);
        setCurrentHash(null);
        lastLoadedHashRef.current = null;
        setIsTesting(false);
        emitDraftChange(null, clearedResults, clearedStates);
        
        // Notify parent component about test confirmation change
        if (onTestConfirmationChange) {
          onTestConfirmationChange();
        }
      }
      
      setFieldsContentHash(newHash);
    }
  }, [formData?.quizit_component_structure, formData?.words_to_avoid, hasHydrated, fieldsContentHash]);

  // Reset slots only when the quizit fields actually change (not on mount/tab switch)
  useEffect(() => {
    // This is now handled by the fieldsContentHash tracking above
    // Keeping this for backward compatibility but it should not run
    return;
  }, [formData?.quizit_component_structure, formData?.words_to_avoid, hasHydrated, currentHash, quizitResults]);

  // Auto-grow textareas on value changes
  useEffect(() => {
    if (testStates[currentTestIndex]?.isTested) {
      autoGrowEl(quizitRef.current);
      autoGrowEl(reasoningRef.current);
    }
    
  }, [currentTestIndex, testStates[currentTestIndex]?.isTested, quizitResults[currentTestIndex]?.quizit, quizitResults[currentTestIndex]?.reasoning]);

  // Auto-resize component textareas on initial load and content changes
  useEffect(() => {
    if (formData?.quizit_component_structure) {
      try {
        const parsed = JSON.parse(formData.quizit_component_structure);
        if (parsed.components && Array.isArray(parsed.components)) {
          // Migrate existing components to have type field if missing
          let needsUpdate = false;
          const migratedComponents = parsed.components.map(comp => {
                         if (!comp.type) {
               needsUpdate = true;
               return { ...comp, type: 'scenario' }; // Default to Scenario Components
             }
            return comp;
          });
          
          // Update if migration was needed
          if (needsUpdate) {
            const newStructure = { ...parsed, components: migratedComponents };
            handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
          }
          
          // Auto-resize all component textareas after a brief delay to ensure DOM is ready
          setTimeout(() => {
            migratedComponents.forEach((component, index) => {
              const textarea = document.querySelector(`textarea[data-component-id="${component.id}"]`);
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error('Error auto-resizing component textareas:', error);
      }
    }
  }, [formData?.quizit_component_structure]);

  // Auto-resize words to avoid textareas on initial load and content changes
  useEffect(() => {
    if (formData?.words_to_avoid) {
      try {
        const words = parseWordsToAvoid(formData.words_to_avoid);
        if (words && Array.isArray(words)) {
          // Auto-resize all word textareas after a brief delay to ensure DOM is ready
          setTimeout(() => {
            words.forEach((word, index) => {
              const textarea = document.querySelector(`textarea[data-word-id="${index}"]`);
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error('Error auto-resizing word textareas:', error);
      }
    }
  }, [formData?.words_to_avoid]);

  // Auto-resize theme injection textareas on initial load and content changes
  useEffect(() => {
    if (formData?.theme_injections) {
      try {
        const injections = parseThemeInjections(formData.theme_injections);
        if (injections && Array.isArray(injections)) {
          // Auto-resize all theme injection textareas after a brief delay to ensure DOM is ready
          setTimeout(() => {
            injections.forEach((injection, index) => {
              const textarea = document.querySelector(`textarea[data-theme-injection-id="${index}"]`);
              if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
              }
            });
          }, 100);
        }
      } catch (error) {
        console.error('Error auto-resizing theme injection textareas:', error);
      }
    }
  }, [formData?.theme_injections]);

  // Load mock theme injections data for testing (remove this in production)
  useEffect(() => {
    if (!formData?.theme_injections && !formData?.theme_injections?.trim()) {
      const mockData = `A team member consistently arrives late to meetings
A software bug is discovered in production
A project deadline is approaching rapidly
A client requests a major scope change
A team member is underperforming
A new technology needs to be implemented`;
      handleInputChange('theme_injections', mockData);
    }
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Quizit Components Section */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="font-medium text-lg">Quizit Configuration</label>
            
            {/* Test completion status indicator */}
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>Tests:</span>
              <span className={`font-medium ${areAllTestsConfirmed() ? 'text-green-600' : 'text-gray-400'}`}>
                {(() => {
                  const confirmedCount = drafts?.slots ? 
                    [0, 1, 2, 3, 4, 5].filter(index => 
                      drafts.slots[index]?.isTested && drafts.slots[index]?.confirmed
                    ).length : 
                    [0, 1, 2, 3, 4, 5].filter(index => 
                      testStates[index]?.isTested && testStates[index]?.confirmed
                    ).length;
                  

                  
                  return confirmedCount;
                })()}/6
              </span>
            </div>
            
            {/* Completion toggle for quizit configuration */}
            <button
              onClick={() => {
                if (areAllTestsConfirmed() && onFieldCompletionToggle) {
                  onFieldCompletionToggle('quizit_configuration', !fieldCompletion?.quizit_configuration);
                }
              }}
              className={`w-4 h-4 rounded border-2 transition-colors ${
                fieldCompletion?.quizit_configuration 
                  ? 'bg-green-500 border-green-500' 
                  : 'bg-white border-gray-300 hover:border-gray-400'
              } ${!areAllTestsConfirmed() ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
              title={
                areAllTestsConfirmed() 
                  ? (fieldCompletion?.quizit_configuration ? 'Mark quizit configuration as incomplete' : 'Mark quizit configuration as complete')
                  : 'Complete and confirm all 6 tests first'
              }
              disabled={!areAllTestsConfirmed()}
            >
              {fieldCompletion?.quizit_configuration && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {cardId && (() => {
              const hasChanges = (formData?.quizit_component_structure ?? '') !== (savedPrompt?.quizit_component_structure ?? '') || 
                                (formData?.words_to_avoid ?? '') !== (savedPrompt?.words_to_avoid ?? '');
              return hasChanges;
            })() && (
              <button
                onClick={async () => {
                  // Reset all fields to saved values (including card_idea)
                  handleInputChange('quizit_component_structure', savedPrompt?.quizit_component_structure || '');
                  handleInputChange('words_to_avoid', savedPrompt?.words_to_avoid || '');
                  handleInputChange('card_idea', savedPrompt?.card_idea || '');

                  // Restore selected permutations from saved data
                  if (savedPrompt?.quizit_valid_permutations) {
                    try {
                      const savedPermutations = JSON.parse(savedPrompt.quizit_valid_permutations);
                      setSelectedPermutations(new Set(savedPermutations));
                    } catch (error) {
                      console.error('Error parsing saved permutations:', error);
                      setSelectedPermutations(new Set());
                    }
                  } else {
                    setSelectedPermutations(new Set());
                  }

                  // Clear current test results first to avoid state conflicts
                  const clearedStates = {
                    0: { isTested: false, isConfirmed: false },
                    1: { isTested: false, isConfirmed: false },
                    2: { isTested: false, isConfirmed: false },
                    3: { isTested: false, isConfirmed: false },
                    4: { isTested: false, isConfirmed: false },
                    5: { isTested: false, isConfirmed: false }
                  };
                  const clearedResults = {
                    0: { quizit: '', reasoning: '', permutation: null },
                    1: { quizit: '', reasoning: '', permutation: null },
                    2: { quizit: '', reasoning: '', permutation: null },
                    3: { quizit: '', reasoning: '', permutation: null },
                    4: { quizit: '', reasoning: '', permutation: null },
                    5: { quizit: '', reasoning: '', permutation: null }
                  };
                  
                  setTestStates(clearedStates);
                  setQuizitResults(clearedResults);

                  // Reload saved tests from DB for the saved prompt
                  try {
                    // Generate hash from saved values using shared utility
                    const components = savedPrompt?.quizit_component_structure || '';
                    const wordsToAvoid = savedPrompt?.words_to_avoid || '';
                    const cardIdea = savedPrompt?.card_idea || '';
                    const hash = generateQuizitHashUtil(components, wordsToAvoid, cardIdea);
                    
                    // Fetch tests from database using the hash
                    const { data, error } = await supabase
                      .from('card_prompt_tests')
                      .select('slot, quizit, reasoning, confirmed, permutation')
                      .eq('card_id', cardId)
                      .eq('prompt_hash', hash)
                      .order('slot', { ascending: true });
                    
                    if (error) {
                      console.error('Failed to load saved prompt tests on reset:', error);
                      // Still set hash and emit cleared state so user can retest
                      setCurrentHash(hash);
                      emitDraftChange(hash, clearedResults, clearedStates);
                      
                      // Notify parent component about test confirmation change
                      if (onTestConfirmationChange) {
                        onTestConfirmationChange();
                      }
                    } else {
                      // Load the tests from database
                      const nextStates = {
                        0: { isTested: false, isConfirmed: false },
                        1: { isTested: false, isConfirmed: false },
                        2: { isTested: false, isConfirmed: false },
                        3: { isTested: false, isConfirmed: false },
                        4: { isTested: false, isConfirmed: false },
                        5: { isTested: false, isConfirmed: false },
                      };
                      const nextResults = {
                        0: { quizit: '', reasoning: '', permutation: null },
                        1: { quizit: '', reasoning: '', permutation: null },
                        2: { quizit: '', reasoning: '', permutation: null },
                        3: { quizit: '', reasoning: '', permutation: null },
                        4: { quizit: '', reasoning: '', permutation: null },
                        5: { quizit: '', reasoning: '', permutation: null },
                      };
                      
                      // Populate with database data
                      (data || []).forEach(row => {
                        nextStates[row.slot] = { 
                          isTested: !!(row.quizit || row.reasoning), 
                          isConfirmed: !!row.confirmed 
                        };
                        nextResults[row.slot] = {
                          quizit: row.quizit || '',
                          reasoning: row.reasoning || '',
                          permutation: row.permutation || null
                        };
                      });
                      
                      setCurrentHash(hash);
                      setTestStates(nextStates);
                      setQuizitResults(nextResults);
                      emitDraftChange(hash, nextResults, nextStates);
                      
                      // Notify parent component about test confirmation change
                      if (onTestConfirmationChange) {
                        onTestConfirmationChange();
                      }
                    }
                  } catch (e) {
                    console.error('Unexpected error during reset to saved:', e);
                  }
                }}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
                title="Reset to saved prompt"
              >
                Reset to saved
              </button>
            )}

          </div>
        </div>
        
        {/* Quizit Components Field */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Quizit Components</label>
            </div>
            {formData?.quizit_component_structure ? (
              <button
                onClick={() => {
                  handleInputChange('quizit_component_structure', '');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            ) : (
            <button
              onClick={() => {
                // Build predefined instructions + card JSON
                const cardJson = {
                  card: {
                    title: formData?.title || '',
                    description: formData?.description || '',
                    card_idea: formData?.card_idea || ''
                  },
                  content: formData?.content || ''
                };
                
                  const instructions = `You are given a concept card and its explanation. Generate a structured quizit configuration with scenario components that would elicit this concept from a reader.

Components should be phrased as concrete situations involving people, not abstract concepts. For example, instead of "Presence of a bold pursuit", use "Person A has a bold pursuit in area X".

Focus on general situations, not specific details like exact names, locations, or specific examples.

For example, if testing for 'sunk cost fallacy', the components would be:
- Person A has already invested time, money, effort, or resources in a project
- Person A cannot recover that investment regardless of future actions  
- Person A faces a current decision point whether to continue or stop
- Person A sees evidence that continuing is unlikely to be worthwhile
- Person A feels compelled to continue "to not waste" what's already invested

Return this structured configuration in the following JSON format:

{
  "components": [
    {
      "id": "A",
      "text": "[component text]",
      "type": "scenario",
      "isPrerequisite": true/false,
      "prerequisites": ["array of component IDs this depends on, if any]"
    }
  ]
}

Rules:
- Prerequisites must come before non-prerequisites
- Components can depend on other components
- Use letters A, B, C, D... for component IDs
- Sort components so prerequisites appear first in the list
- Set type: "scenario" for components that should appear in the quizit scenario
- Set type: "reasoning" for components that are additional concepts for reasoning (not in the scenario)
- Default all components to type: "scenario" unless they should only appear in reasoning

Example:
- type: "scenario" components are the core elements that will appear in the quizit scenario (e.g., "Person A is pursuing a bold project", "Person A continues working a stable job")
- type: "reasoning" components are additional concepts the reader should think about (e.g., "Person A should consider risk tolerance", "Person A should evaluate opportunity costs")`;
                
                const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
                navigator.clipboard.writeText(payload);
                 setQuizitComponentsPromptCopied(true);
                 setTimeout(() => setQuizitComponentsPromptCopied(false), 2000);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
              title="Copy prompt to clipboard"
            >
               {quizitComponentsPromptCopied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>Prompt</span>
            </button>
            )}
          </div>
          
          {/* Paste Interface */}
          {!formData?.quizit_component_structure ? (
            <div 
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                handleInputChange('quizit_component_structure', pastedText);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.readText().then(text => {
                    handleInputChange('quizit_component_structure', text);
                  });
                }
              }}
              tabIndex={0}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Click to paste JSON configuration</div>
                <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
        </div>
            </div>
          ) : (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
              
              {/* Components Display */}
              {(() => {
                try {
                  const parsed = JSON.parse(formData.quizit_component_structure);
                  if (parsed.components && Array.isArray(parsed.components)) {
                                        // Separate components by type
                    const quizitComponents = parsed.components.filter(comp => comp.type === 'scenario');
                    const reasoningComponents = parsed.components.filter(comp => comp.type === 'reasoning');
                    
                    return (
                      <div className="space-y-4 mb-4">
                        {/* Scenario Components Section */}
                        <div>
                          <div className="text-xs text-gray-600 font-medium mb-2">Scenario Components</div>
                          <div className="space-y-2">
                            {quizitComponents.map((component, index) => {
                              const originalIndex = parsed.components.findIndex(c => c.id === component.id);
                              return (
                                <div key={component.id} className="flex items-center space-x-3">
                                  {/* Component content with letter prefix */}
                                  <div className="flex-1 bg-white rounded border border-gray-200 p-3">
                                    <div className="text-sm text-gray-900">
                                      <div className="flex">
                                        <span className="font-bold text-gray-700 flex-shrink-0 mr-3">{component.id})</span>
          <textarea
                                          value={component.text}
            onChange={(e) => {
                                            const newComponents = [...parsed.components];
                                            newComponents[originalIndex].text = e.target.value;
                                            const newStructure = { ...parsed, components: newComponents };
                                            handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
                                            
                                            // Auto-resize textarea to fit content
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                          }}
                                          className="flex-1 text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden"
                                          placeholder="Enter component text..."
                                          rows={1}
                                          style={{ minHeight: '1.5rem' }}
                                          data-component-id={component.id}
                                        />
                                      </div>
                                    </div>
        </div>

                                                                     {/* Toggle Button */}
                                   <button
                                     onClick={() => handleComponentTypeToggle(originalIndex)}
                                     className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                     title="Move to Reasoning Components"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                     </svg>
                                   </button>
                                   
                                   {/* Delete Button */}
                                   <button
                                     onClick={() => handleComponentDelete(originalIndex)}
                                     className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                     title="Delete component"
                                   >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                                     </svg>
                                   </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Reasoning Components Section */}
        <div>
                          <div className="text-xs text-gray-600 font-medium mb-2">Reasoning Components</div>
                          <div className="space-y-2">
                            {reasoningComponents.map((component, index) => {
                              const originalIndex = parsed.components.findIndex(c => c.id === component.id);
                              return (
                                <div key={component.id} className="flex items-center space-x-3">
                                  {/* Component content with letter prefix */}
                                  <div className="flex-1 bg-white rounded border border-gray-200 p-3">
                                    <div className="text-sm text-gray-900">
                                      <div className="flex">
                                        <span className="font-bold text-gray-700 flex-shrink-0 mr-3">{component.id})</span>
          <textarea
                                          value={component.text}
            onChange={(e) => {
                                            const newComponents = [...parsed.components];
                                            newComponents[originalIndex].text = e.target.value;
                                            const newStructure = { ...parsed, components: newComponents };
                                            handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
                                            
                                            // Auto-resize textarea to fit content
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                          }}
                                          className="flex-1 text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden"
                                          placeholder="Enter component text..."
                                          rows={1}
                                          style={{ minHeight: '1.5rem' }}
                                          data-component-id={component.id}
                                        />
                                      </div>
        </div>
      </div>
                                  
                                                                     {/* Toggle Button */}
                                   <button
                                     onClick={() => handleComponentTypeToggle(originalIndex)}
                                     className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                     title="Move to Scenario Components"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                     </svg>
                                   </button>
                                   
                                   {/* Delete Button */}
                                   <button
                                     onClick={() => handleComponentDelete(originalIndex)}
                                     className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                     title="Delete component"
                                   >
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                                     </svg>
                                   </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Add Component Button */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={handleAddComponent}
                            className="flex-1 p-3 border-1 border-dashed border-gray-300 rounded text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium">Add Component</span>
                          </button>
                          <div className="flex-shrink-0 w-18"></div>
                        </div>
                        
                        {/* Dependencies Editor */}
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-xs text-gray-600 mb-2 font-medium">Dependencies:</div>
                          {(() => {
                            // Filter to only scenario components
                            const scenarioComponents = parsed.components.filter(comp => comp.type === 'scenario');
                            
                            if (scenarioComponents.length === 0) {
                              return (
                                <div className="text-xs text-gray-500 italic">
                                  No scenario components found
                                </div>
                              );
                            }
                            
                            // Check if any dependencies reference reasoning components
                            let hasHiddenDependencies = false;
                            let hiddenDependencyCount = 0;
                            
                            scenarioComponents.forEach(component => {
                              if (component.prerequisites && Array.isArray(component.prerequisites)) {
                                component.prerequisites.forEach(prereqId => {
                                  const prereqComponent = parsed.components.find(c => c.id === prereqId);
                                  if (prereqComponent && prereqComponent.type === 'reasoning') {
                                    hasHiddenDependencies = true;
                                    hiddenDependencyCount++;
                                  }
                                });
                              }
                            });
                            
                            return (
                              <div className="space-y-2">
                                {scenarioComponents.map((component, index) => {
                                  // Find the original index in the full components array
                                  const originalIndex = parsed.components.findIndex(c => c.id === component.id);
                                  
                                  // Filter prerequisites to only show scenario components
                                  const visiblePrerequisites = component.prerequisites && Array.isArray(component.prerequisites) 
                                    ? component.prerequisites.filter(prereqId => {
                                        const prereqComponent = parsed.components.find(c => c.id === prereqId);
                                        return prereqComponent && prereqComponent.type === 'scenario';
                                      })
                                    : [];
                                  
                                  return (
                                    <div key={component.id} className="flex items-center text-xs text-gray-700">
                                      <span className="font-mono mr-2">{component.id}</span>
                                      <span className="mx-2">←</span>
                                      <input
                                        type="text"
                                        value={visiblePrerequisites.join(', ')}
                                        onChange={(e) => {
                                          const input = e.target.value;
                                          // Parse input and auto-format with commas and spaces
                                          const prerequisites = input
                                            .replace(/[,\s]+/g, '') // Remove existing commas and spaces
                                            .split('')
                                            .filter(char => char.length > 0)
                                            .map(char => char.toUpperCase());
                                          
                                          const newComponents = [...parsed.components];
                                          newComponents[originalIndex].prerequisites = prerequisites.length > 0 ? prerequisites : [];
                                          const newStructure = { ...parsed, components: newComponents };
                                          handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
                                        }}
                                        className="flex-1 text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 font-mono"
                                        placeholder="_"
                                      />
                                    </div>
                                  );
                                })}
                                
                                {/* Show note about hidden dependencies */}
                                {hasHiddenDependencies && (
                                  <div className="text-xs text-gray-500 italic mt-2 pt-2 border-t border-gray-200">
                                    Some dependencies are hidden (referenced components are in reasoning section)
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Valid Permutations Display */}
                        {(() => {
                          const { validOrderings, error } = generatePermutations(formData.quizit_component_structure);
                          
                          if (error) {
                            return (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-xs text-red-600 mb-2 font-medium">Error:</div>
                                <div className="text-xs text-red-600">{error}</div>
                              </div>
                            );
                          }
                          
                          if (validOrderings && validOrderings.length > 0) {
                            return (
                              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                                                  <div className="text-xs text-gray-600 font-medium mb-2">Valid Orderings:</div>
                                <div className="text-xs text-gray-500 mb-2">
                                  Select up to 3 permutations ({selectedPermutations.size}/3 selected)
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {validOrderings.map((permutation, index) => {
                                    const isSelected = selectedPermutations.has(permutation);
                                    const canSelect = canSelectPermutation(permutation);
                                    
                                    return (
                                      <button
                                        key={index}
                                        onClick={() => handlePermutationSelect(permutation)}
                                        disabled={!canSelect}
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                                          isSelected
                                            ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                            : canSelect
                                            ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                            : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                        title={`Selected: ${isSelected}, Can Select: ${canSelect}, Total Selected: ${selectedPermutations.size}`}
                                      >
                                        {permutation}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          
                          return null;
                        })()}
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        Invalid structure: Missing 'components' array
                      </div>
                    );
                  }
                } catch (error) {
                  return (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      Invalid JSON: {error.message}
                    </div>
                  );
                }
              })()}
            </div>
          )}
          

          

        </div>

        {/* Words/Phrases/Expressions to Avoid Field */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Words/Phrases/Expressions to Avoid</label>
            </div>
            {formData?.words_to_avoid && formData.words_to_avoid.length > 0 ? (
              <button
                onClick={() => {
                  handleInputChange('words_to_avoid', '');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                title="Reset words to avoid"
              >
                Reset
              </button>
            ) : (
              <button
                onClick={() => {
                  // Build predefined instructions + card JSON
                  const cardJson = {
                    card: {
                      title: formData?.title || '',
                      description: formData?.description || '',
                      card_idea: formData?.card_idea || ''
                    },
                    content: formData?.content || ''
                  };
                  
                  const instructions = `You are given a concept card and its explanation. Generate a list of words, phrases, and expressions that should be avoided when testing for this concept.

These are terms that would make the concept too obvious to the reader, defeating the purpose of the quizit.

Focus on:
- Direct synonyms of the concept
- Technical jargon that immediately identifies the concept
- Common phrases that are strongly associated with the concept
- Academic or formal terms that give away the answer

For example, if testing for 'sunk cost fallacy', words to avoid would be:
- "sunk cost"
- "wasted investment" 
- "throwing good money after bad"
- "escalation of commitment"
- "irrational persistence"
- "cost fallacy"
- "investment trap"

Return your response as a simple list, one term per line:
[term 1]
[term 2]
[term 3]
...`;
                  
                 const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
                 navigator.clipboard.writeText(payload);
                 setWordsPromptCopied(true);
                 setTimeout(() => setWordsPromptCopied(false), 2000);
               }}
               className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
               title="Copy words prompt to clipboard"
             >
               {wordsPromptCopied ? (
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               ) : (
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
               )}
               <span>Prompt</span>
             </button>
            )}
          </div>
          
          {/* Paste Interface */}
          {!formData?.words_to_avoid || formData.words_to_avoid.length === 0 ? (
            <div 
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                handleInputChange('words_to_avoid', pastedText);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.readText().then(text => {
                    handleInputChange('words_to_avoid', text);
                  });
                }
              }}

              tabIndex={0}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Click to paste words/phrases</div>
                <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
              </div>
            </div>
                      ) : (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
                {/* Display individual words */}
                {(() => {
                  try {
                    const words = parseWordsToAvoid(formData.words_to_avoid);
                    if (words && Array.isArray(words)) {
                      return (
                        <div className="space-y-2 mb-4">
                          {words.map((word, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="flex-1 bg-white rounded border border-gray-200 p-3">
                                <div className="text-sm text-gray-900 flex items-center">
                                  <textarea
                                    value={word}
                                    onChange={(e) => {
                                      const newWords = [...words];
                                      newWords[index] = e.target.value;
                                      const newText = newWords.join('\n');
                                      handleInputChange('words_to_avoid', newText);
                                      
                                      // Auto-resize textarea
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    className="w-full text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 resize-none overflow-hidden"
                                    placeholder="Enter word/phrase to avoid..."
                                    rows={1}
                                    style={{ minHeight: '1.5rem' }}
                                    data-word-id={index}
                                  />
                                </div>
                              </div>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteWordToAvoid(index)}
                                className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete word"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          
                          {/* Add Word Button */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={handleAddWordToAvoid}
                              className="flex-1 p-3 border-1 border-dashed border-gray-300 rounded text-gray-500 hover:text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                             
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span className="text-sm font-medium">Add Word/Phrase</span>
                            </button>
                            <div className="flex-shrink-0 w-7"></div>
                          </div>
                        </div>
                      );
                    }
                  } catch (error) {
                    console.error('Error parsing words to avoid:', error);
                  }
                  return null;
                })()}
              </div>
            )}
        </div>

        {/* Theme Injections Field */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Theme Injections</label>
            </div>
            {formData?.theme_injections && formData.theme_injections.trim() ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    // TODO: Implement view swaps functionality
                    console.log('View Swaps clicked');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  View Swaps
                </button>
                <button
                  onClick={() => setShowTags(!showTags)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  {showTags ? 'Hide Filter' : 'Filter By Tags'}
                </button>
                <button
                  onClick={handleResetThemeInjections}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  title="Reset theme injections"
                >
                  Reset
                </button>
              </div>
            ) : (
              <button
                onClick={handleCopyThemeInjectionsPrompt}
                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                title="Copy theme injections prompt to clipboard"
              >
                {themeInjectionsPromptCopied ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                <span>Prompt</span>
              </button>
            )}
          </div>
          
          {/* Paste Interface - Only show when no data exists */}
          {!formData?.theme_injections || !formData.theme_injections.trim() ? (
            <div 
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                handleInputChange('theme_injections', pastedText);
              }}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                  e.preventDefault();
                  navigator.clipboard.readText().then(text => {
                    handleInputChange('theme_injections', text);
                  });
                }
              }}
              tabIndex={0}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Click to paste theme injections</div>
                <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
              </div>
            </div>
          ) : (
            /* Theme Injections Library - Only show when data exists */
            <div className="mt-3">
              <ThemeInjectionsLibrary
                showTags={showTags}
                selectedTag={selectedTag}
                tagSearchQuery={tagSearchQuery}
                availableTags={availableTags}
                filteredTags={filteredTags}
                filteredScenarios={filteredScenarios}
                expandedScenarios={expandedScenarios}
                onToggleTags={() => setShowTags(!showTags)}
                onTagSelect={setSelectedTag}
                onTagSearchChange={setTagSearchQuery}
                onToggleScenario={toggleScenario}
                onViewSwaps={() => {
                  // TODO: Implement view swaps functionality
                  console.log('View Swaps clicked');
                }}
                onReset={() => {
                  handleInputChange('theme_injections', '');
                }}
                showHeader={false}
                noBackground={true}
              />
            </div>
          )}
        </div>
      </div>



      {/* Current Test Section */}
      <div className="bg-white rounded-lg p-6">
        {/* Section Header with Reset Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-lg">Test Results</h3>
          <button
            onClick={() => {
              // Clear all tests
              const clearedResults = {};
              const clearedStates = {};
              
              [0,1,2,3,4,5].forEach(index => {
                clearedResults[index] = { 
                  quizit: '', 
                  reasoning: '', 
                  feedback: '', 
                  permutation: null
                };
                clearedStates[index] = { isTested: false, isConfirmed: false };
              });
              
              setQuizitResults(clearedResults);
              setTestStates(clearedStates);
              
              // Emit the cleared state to parent so it can be saved
              emitDraftChange(currentHash, clearedResults, clearedStates);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="Reset all tests"
          >
            Reset
          </button>
        </div>
        
        {/* Test Navigation */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const status = getTestStatus(index);
            const isActive = currentTestIndex === index;
            const permutation = getPermutationForTest(index, selectedPermutations);
            
            return (
              <button
                key={index}
                onClick={() => setCurrentTestIndex(index)}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-blue-500 ring-offset-1' 
                    : 'hover:shadow-md'
                } ${getStatusColor(status)}`}
              >
                <span className="font-bold">Test {index + 1}</span>
                {permutation && (
                  <span className={`text-[10px] font-mono leading-tight ${getPermutationColor(permutation, selectedPermutations)}`}>
                    {permutation}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* removed right-side Tested badge */}

        <div className="space-y-4">
          {/* Quizit Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Generated Quizit</h4>
            {testStates[currentTestIndex]?.isTested ? (
              <textarea
                ref={quizitRef}
                value={quizitResults[currentTestIndex]?.quizit || ''}
                onChange={(e) => {
                  const next = {
                    ...quizitResults,
                    [currentTestIndex]: { ...quizitResults[currentTestIndex], quizit: e.target.value }
                  };
                  setQuizitResults(next);
                  emitDraftChange(currentHash, next, testStates);
                }}
                onInput={(e) => autoGrowEl(e.target)}
                className="w-full p-3 border border-gray-200 rounded text-sm overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ height: 'auto' }}
                placeholder="Generated quizit will appear here..."
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-gray-500">Click "Test" to generate quizit content...</div>
            )}
          </div>

          {/* Reasoning Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Reasoning</h4>
            {testStates[currentTestIndex]?.isTested ? (
              <textarea
                ref={reasoningRef}
                value={quizitResults[currentTestIndex]?.reasoning || ''}
                onChange={(e) => {
                  const next = {
                    ...quizitResults,
                    [currentTestIndex]: { ...quizitResults[currentTestIndex], reasoning: e.target.value }
                  };
                  setQuizitResults(next);
                  emitDraftChange(currentHash, next, testStates);
                }}
                onInput={(e) => autoGrowEl(e.target)}
                className="w-full p-3 border border-gray-200 rounded text-sm overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ height: 'auto' }}
                placeholder="Generated reasoning will appear here..."
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-gray-500">Click "Test" to generate reasoning...</div>
            )}
          </div>



          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            {!testStates[currentTestIndex]?.isTested ? (
              <button
                onClick={() => handleTestClick(currentTestIndex)}
                disabled={!formData?.quizit_component_structure || !formData?.words_to_avoid || !selectedPermutations.size || isTesting}
                className={`px-6 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed ${isTesting ? 'bg-blue-400 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                {isTesting ? 'Testing…' : 'Test'}
              </button>
            ) : !testStates[currentTestIndex]?.isConfirmed ? (
              <button
                onClick={() => handleConfirmTest(currentTestIndex)}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Confirm
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Summary removed */}
    </div>
  );
};

export default QuizitTab; 