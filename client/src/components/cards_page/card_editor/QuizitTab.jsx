import React, { useEffect, useRef, useState } from 'react';
import { generateValidOrderings } from '../../../utils/dependencyUtils';
import { supabase } from '../../../services/supabaseClient';

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
  const [promptCopied, setPromptCopied] = useState(false);
  const [quizitResults, setQuizitResults] = useState({
    0: { quizit: '', reasoning: '', feedback: '' },
    1: { quizit: '', reasoning: '', feedback: '' },
    2: { quizit: '', reasoning: '', feedback: '' },
    3: { quizit: '', reasoning: '', feedback: '' },
    4: { quizit: '', reasoning: '', feedback: '' },
    5: { quizit: '', reasoning: '', feedback: '' }
  });
  const [isTesting, setIsTesting] = useState(false);
  const [currentHash, setCurrentHash] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fieldsContentHash, setFieldsContentHash] = useState(null);
  const [pasteMessage, setPasteMessage] = useState('Click to paste JSON configuration');

  const quizitRef = useRef(null);
  const reasoningRef = useRef(null);
  const promptRef = useRef(null);
  const wordsToAvoidRef = useRef(null);
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

  // Generate hash from combined quizit fields
  const generateQuizitHash = async () => {
    const components = formData?.quizit_component_structure || '';
    const wordsToAvoid = formData?.words_to_avoid || '';
    const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
    return await sha256(combinedContent);
  };

  // Generate permutations from component structure
  const generatePermutations = (componentStructure) => {
    if (!componentStructure) return { validOrderings: [], error: null };
    
    try {
      const parsed = JSON.parse(componentStructure);
      if (!parsed.components || !Array.isArray(parsed.components)) {
        return { validOrderings: [], error: null };
      }
      
      return generateValidOrderings(parsed.components, 10); // Increased limit to show more permutations
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
                feedback: '', 
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
    
    if (permCount === 1) {
      // All 6 tests use the same permutation
      return orderedSelectedPermutations[0];
    }
    
    if (permCount === 2) {
      // First permutation in valid orderings gets first 3 tests, second gets last 3 tests
      return testIndex < 3 ? orderedSelectedPermutations[0] : orderedSelectedPermutations[1];
    }
    
    if (permCount === 3) {
      // First permutation gets tests 0,1, second gets tests 2,3, third gets tests 4,5
      return orderedSelectedPermutations[Math.floor(testIndex / 2)];
    }
    
    // 4+ permutations: first gets extra, others get minimum 2
    const baseTestsPerPerm = Math.floor(totalTests / permCount);
    const extraTests = totalTests % permCount;
    
    if (testIndex < (baseTestsPerPerm + extraTests)) {
      return orderedSelectedPermutations[0];
    }
    
    const permIndex = Math.floor((testIndex - (baseTestsPerPerm + extraTests)) / baseTestsPerPerm) + 1;
    return orderedSelectedPermutations[permIndex] || orderedSelectedPermutations[0]; // fallback
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
          feedback: '', 
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

  // Clear all tests when dependencies change (component structure changes)
  useEffect(() => {
    if (formData?.quizit_component_structure) {
      // Clear all tests when component structure changes
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
    }
  }, [formData?.quizit_component_structure]);







  const emitDraftChange = (hash = currentHash, localResults = quizitResults, localStates = testStates) => {
    if (!onTestsDraftChange) return;
    const slots = {};
    [0,1,2,3,4,5].forEach(i => {
      const r = localResults[i] || { quizit: '', reasoning: '', feedback: '', permutation: null };
      const s = localStates[i] || { isTested: false, isConfirmed: false };
      slots[i] = {
        quizit: r.quizit || '',
        reasoning: r.reasoning || '',
        feedback: r.feedback || '',
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
      return s && (s.quizit || s.reasoning || s.feedback || s.isTested || s.confirmed);
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
      0: { quizit: drafts.slots?.[0]?.quizit || '', reasoning: drafts.slots?.[0]?.reasoning || '', feedback: drafts.slots?.[0]?.feedback || '', permutation: drafts.slots?.[0]?.permutation || null },
      1: { quizit: drafts.slots?.[1]?.quizit || '', reasoning: drafts.slots?.[1]?.reasoning || '', feedback: drafts.slots?.[1]?.feedback || '', permutation: drafts.slots?.[1]?.permutation || null },
      2: { quizit: drafts.slots?.[2]?.quizit || '', reasoning: drafts.slots?.[2]?.reasoning || '', feedback: drafts.slots?.[2]?.feedback || '', permutation: drafts.slots?.[2]?.permutation || null },
      3: { quizit: drafts.slots?.[3]?.quizit || '', reasoning: drafts.slots?.[3]?.reasoning || '', feedback: drafts.slots?.[3]?.feedback || '', permutation: drafts.slots?.[3]?.permutation || null },
      4: { quizit: drafts.slots?.[4]?.quizit || '', reasoning: drafts.slots?.[4]?.reasoning || '', feedback: drafts.slots?.[4]?.feedback || '', permutation: drafts.slots?.[4]?.permutation || null },
      5: { quizit: drafts.slots?.[5]?.quizit || '', reasoning: drafts.slots?.[5]?.reasoning || '', feedback: drafts.slots?.[5]?.feedback || '', permutation: drafts.slots?.[5]?.permutation || null },
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
      
      // Parse the structured components and reorder based on permutation
      let components = '';
      try {
        const parsed = JSON.parse(formData.quizit_component_structure);
        if (parsed.components && Array.isArray(parsed.components)) {
          // Reorder components based on permutation
          const reorderedComponents = reorderComponentsByPermutation(parsed.components, permutation);
          components = reorderedComponents.map(c => c.text).join('\n');
        } else {
          throw new Error('Invalid component structure');
        }
      } catch (parseError) {
        alert('Invalid component structure. Please check your JSON format.');
        setIsTesting(false);
        return;
      }
      
      const wordsToAvoid = formData.words_to_avoid || '';
      const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
      
      const { data, error } = await supabase.functions.invoke('quizit-generate', {
        body: { 
          components: components,
          wordsToAvoid: formData.words_to_avoid || ''
        }
      });
      if (error) {
        console.error('Error generating quizit:', error);
        alert('Failed to generate. Please try again.');
        return;
      }
      const { quizit = '', reasoning = '' } = (data?.data || data) || {};
      // Store permutation with test results
      setQuizitResults(prev => ({
        ...prev,
        [index]: { quizit, reasoning, feedback: prev[index]?.feedback || '', permutation }
      }));
      setTestStates(prev => ({
        ...prev,
        [index]: { ...prev[index], isTested: true }
      }));
      // Emit aggregated drafts upward for save-time persistence
      const localResults = {
        ...quizitResults,
        [index]: { quizit, reasoning, feedback: quizitResults[index]?.feedback || '', permutation }
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
          0: { quizit: '', reasoning: '', feedback: '' },
          1: { quizit: '', reasoning: '', feedback: '' },
          2: { quizit: '', reasoning: '', feedback: '' },
          3: { quizit: '', reasoning: '', feedback: '' },
          4: { quizit: '', reasoning: '', feedback: '' },
          5: { quizit: '', reasoning: '', feedback: '' }
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
    autoGrowEl(promptRef.current);
    autoGrowEl(wordsToAvoidRef.current);
    
  }, [currentTestIndex, testStates[currentTestIndex]?.isTested, quizitResults[currentTestIndex]?.quizit, quizitResults[currentTestIndex]?.reasoning]);

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
                  // Reset both new fields to saved values
                  handleInputChange('quizit_component_structure', savedPrompt?.quizit_component_structure || '');
                  handleInputChange('words_to_avoid', savedPrompt?.words_to_avoid || '');

                  // Reload saved tests from DB for the saved prompt
                  try {
                    // Generate hash from saved values
                    const components = savedPrompt?.quizit_component_structure || '';
                    const wordsToAvoid = savedPrompt?.words_to_avoid || '';
                    const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
                    
                    // Simple hash function for consistency with save logic
                    const generateHash = (text) => {
                      let hash = 5381;
                      for (let i = 0; i < text.length; i += 1) {
                        hash = ((hash << 5) + hash) + text.charCodeAt(i);
                        hash |= 0; // force 32-bit
                      }
                      return (hash >>> 0).toString(16).padStart(8, '0');
                    };
                    
                    const hash = generateHash(combinedContent);
                    
                    // Fetch tests from database using the hash
                    const { data, error } = await supabase
                      .from('card_prompt_tests')
                      .select('slot, quizit, reasoning, feedback, confirmed')
                      .eq('card_id', cardId)
                      .eq('prompt_hash', hash)
                      .order('slot', { ascending: true });
                    
                    if (error) {
                      console.error('Failed to load saved prompt tests on reset:', error);
                      // Still set hash and clear states so user can retest
                      setCurrentHash(hash);
                      const clearedStates = {
                        0: { isTested: false, isConfirmed: false },
                        1: { isTested: false, isConfirmed: false },
                        2: { isTested: false, isConfirmed: false },
                        3: { isTested: false, isConfirmed: false },
                        4: { isTested: false, isConfirmed: false },
                        5: { isTested: false, isConfirmed: false }
                      };
                      const clearedResults = {
                        0: { quizit: '', reasoning: '', feedback: '' },
                        1: { quizit: '', reasoning: '', feedback: '' },
                        2: { quizit: '', reasoning: '', feedback: '' },
                        3: { quizit: '', reasoning: '', feedback: '' },
                        4: { quizit: '', reasoning: '', feedback: '' },
                        5: { quizit: '', reasoning: '', feedback: '' }
                      };
                      setTestStates(clearedStates);
                      setQuizitResults(clearedResults);
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
                        0: { quizit: '', reasoning: '', feedback: '' },
                        1: { quizit: '', reasoning: '', feedback: '' },
                        2: { quizit: '', reasoning: '', feedback: '' },
                        3: { quizit: '', reasoning: '', feedback: '' },
                        4: { quizit: '', reasoning: '', feedback: '' },
                        5: { quizit: '', reasoning: '', feedback: '' },
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
                          feedback: row.feedback || ''
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
                
                const instructions = `You are given a concept card and its explanation. Generate:

1. A list of scenario components that would elicit this concept from a reader
2. A list of words/phrases to avoid that would make the concept too obvious

Components should be phrased as concrete situations involving people, not abstract concepts. For example, instead of "Presence of a bold pursuit", use "Person A has a bold pursuit in area X".

Focus on general situations, not specific details like exact names, locations, or specific examples.

For example, if testing for 'sunk cost fallacy', the components would be:
- Person A has already invested time, money, effort, or resources in a project
- Person A cannot recover that investment regardless of future actions  
- Person A faces a current decision point whether to continue or stop
- Person A sees evidence that continuing is unlikely to be worthwhile
- Person A feels compelled to continue "to not waste" what's already invested

And words to avoid would be:
- "sunk cost"
- "wasted investment" 
- "throwing good money after bad"
- etc.

Return your response in this format:

Components:
- [component 1]
- [component 2]
...

Words to Avoid:
- [term 1]
- [term 2]
...

Now, using the components you just generated, create a structured quizit configuration. Analyze the components to determine:

1. Which components are prerequisites (must come before others)
2. Any dependency relationships between components

Return this structured configuration in the following JSON format:

{
  "components": [
    {
      "id": "A",
      "text": "[component text]",
      "isPrerequisite": true/false,
      "prerequisites": ["array of component IDs this depends on, if any]"
    }
  ]
}

Rules:
- Prerequisites must come before non-prerequisites
- Components can depend on other components
- Use letters A, B, C, D... for component IDs
- Sort components so prerequisites appear first in the list`;
                
                const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
                navigator.clipboard.writeText(payload);
                setPromptCopied(true);
                setTimeout(() => setPromptCopied(false), 2000);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
              title="Copy prompt to clipboard"
            >
              {promptCopied ? (
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
          </div>
        </div>
        
        {/* Quizit Components Field */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Quizit Components</label>
            </div>
            {formData?.quizit_component_structure && (
              <button
                onClick={() => {
                  handleInputChange('quizit_component_structure', '');
                  setPasteMessage('Click to paste JSON configuration');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          
          {/* Paste Interface */}
          {!formData?.quizit_component_structure ? (
            <div 
              onClick={() => {
                // Focus the hidden textarea to capture paste
                promptRef.current?.focus();
                // Show a brief message
                setPasteMessage('Press Ctrl+V (or Cmd+V) to paste');
                // Clear message after 3 seconds
                setTimeout(() => setPasteMessage('Click to paste JSON configuration'), 3000);
              }}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-gray-500 text-sm mb-1">Click to paste JSON configuration</div>
                <div className="text-gray-400 text-xs">{pasteMessage}</div>
              </div>
            </div>
          ) : (
                          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
              
              {/* Components Display */}
              {(() => {
                try {
                  const parsed = JSON.parse(formData.quizit_component_structure);
                  if (parsed.components && Array.isArray(parsed.components)) {
                    return (
                      <div className="space-y-2 mb-4">
                        {parsed.components.map((component, index) => (
                          <div key={component.id} className="flex items-center space-x-3">
                            {/* Component content with letter prefix */}
                            <div className="flex-1 bg-white rounded border border-gray-200 p-3">
                              <div className="text-sm text-gray-900">
                                <div className="flex">
                                  <span className="font-bold text-gray-700 flex-shrink-0 mr-3">{component.id})</span>
                                  <input
                                    type="text"
                                    value={component.text}
                                    onChange={(e) => {
                                      const newComponents = [...parsed.components];
                                      newComponents[index].text = e.target.value;
                                      const newStructure = { ...parsed, components: newComponents };
                                      handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
                                    }}
                                    className="flex-1 text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                                    placeholder="Enter component text..."
                                  />
                                </div>
                              </div>
                            </div>
                            

                          </div>
                        ))}
                        
                        {/* Dependencies Editor */}
                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="text-xs text-gray-600 mb-2 font-medium">Dependencies:</div>
                          <div className="space-y-2">
                            {parsed.components.map((component, index) => (
                              <div key={index} className="flex items-center text-xs text-gray-700">
                                <span className="font-mono mr-2">{component.id}</span>
                                <span className="mx-2">←</span>
                                <input
                                  type="text"
                                  value={component.prerequisites ? component.prerequisites.join(', ') : ''}
                                  onChange={(e) => {
                                    const input = e.target.value;
                                    // Parse input and auto-format with commas and spaces
                                    const prerequisites = input
                                      .replace(/[,\s]+/g, '') // Remove existing commas and spaces
                                      .split('')
                                      .filter(char => char.length > 0)
                                      .map(char => char.toUpperCase());
                                    
                                    const newComponents = [...parsed.components];
                                    newComponents[index].prerequisites = prerequisites.length > 0 ? prerequisites : [];
                                    const newStructure = { ...parsed, components: newComponents };
                                    handleInputChange('quizit_component_structure', JSON.stringify(newStructure));
                                  }}
                                  className="flex-1 text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 font-mono"
                                  placeholder="_"
                                />
                              </div>
                            ))}
                          </div>
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
          
          {/* Hidden textarea for paste handling */}
          <textarea
            ref={promptRef}
            value=""
            onChange={() => {}} // No onChange needed
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              handleInputChange('quizit_component_structure', pastedText);
              setPasteMessage('Click to paste JSON configuration');
            }}
            className="absolute -left-[9999px] opacity-0 pointer-events-none"
            placeholder=""
          />
        </div>

        {/* Words/Phrases/Expressions to Avoid Field */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <label className="font-medium">Words/Phrases/Expressions to Avoid</label>
            </div>
          </div>
          <textarea
            ref={wordsToAvoidRef}
            value={(formData?.words_to_avoid) || ''}
            onChange={(e) => {
              handleInputChange('words_to_avoid', e.target.value);
            }}
            onInput={(e) => autoGrowEl(e.target)}
            className="w-full p-2 border border-gray-300 rounded h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter specific terms, concepts, and examples that should NOT be used in the generated scenarios..."
          />
        </div>
      </div>

      {/* Current Test Section */}
      <div className="bg-white rounded-lg p-6">
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

          {/* Feedback Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Feedback</h4>
            <textarea
              value={quizitResults[currentTestIndex]?.feedback || ''}
              onChange={(e) => {
                const next = {
                  ...quizitResults,
                  [currentTestIndex]: { ...quizitResults[currentTestIndex], feedback: e.target.value || '' }
                };
                setQuizitResults(next);
                emitDraftChange(currentHash, next, testStates);
              }}
              className="w-full p-3 border border-gray-200 rounded text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide feedback on this test result. This feedback will be used when generating a new prompt alongside the quizit and reasoning output..."
            />
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