import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../services/supabaseClient';

const QuizitTab = ({ formData, handleInputChange, handleGenerate, onTestsDraftChange, savedPrompt, drafts, cardId, fieldCompletion = {}, onFieldCompletionToggle, onTestConfirmationChange }) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testStates, setTestStates] = useState({
    0: { isTested: false, isConfirmed: false },
    1: { isTested: false, isConfirmed: false },
    2: { isTested: false, isConfirmed: false },
    3: { isTested: false, isConfirmed: false },
    4: { isTested: false, isConfirmed: false }
  });
  const [promptCopied, setPromptCopied] = useState(false);
  const [quizitResults, setQuizitResults] = useState({
    0: { quizit: '', reasoning: '', feedback: '' },
    1: { quizit: '', reasoning: '', feedback: '' },
    2: { quizit: '', reasoning: '', feedback: '' },
    3: { quizit: '', reasoning: '', feedback: '' },
    4: { quizit: '', reasoning: '', feedback: '' }
  });
  const [isTesting, setIsTesting] = useState(false);
  const [currentHash, setCurrentHash] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [fieldsContentHash, setFieldsContentHash] = useState(null);
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
    const components = formData?.quizit_components || '';
    const wordsToAvoid = formData?.words_to_avoid || '';
    const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
    return await sha256(combinedContent);
  };

  const emitDraftChange = (hash = currentHash, localResults = quizitResults, localStates = testStates) => {
    if (!onTestsDraftChange) return;
    const slots = {};
    [0,1,2,3,4].forEach(i => {
      const r = localResults[i] || { quizit: '', reasoning: '', feedback: '' };
      const s = localStates[i] || { isTested: false, isConfirmed: false };
      slots[i] = {
        quizit: r.quizit || '',
        reasoning: r.reasoning || '',
        feedback: r.feedback || '',
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
      return [0, 1, 2, 3, 4].every(index => 
        drafts.slots[index]?.isTested && drafts.slots[index]?.confirmed
      );
    }
    // Fallback to local state
    return [0, 1, 2, 3, 4].every(index => 
      testStates[index]?.isTested && testStates[index]?.confirmed
    );
  };

  // Hydrate local state from parent drafts (persists across tab switches)
  useEffect(() => {
    
    if (!drafts) return;
    // If drafts has a promptHash or any slot content, hydrate
    const hasAny = !!drafts.promptHash || [0,1,2,3,4].some(i => {
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
    };
    const nextResults = {
      0: { quizit: drafts.slots?.[0]?.quizit || '', reasoning: drafts.slots?.[0]?.reasoning || '', feedback: drafts.slots?.[0]?.feedback || '' },
      1: { quizit: drafts.slots?.[1]?.quizit || '', reasoning: drafts.slots?.[1]?.reasoning || '', feedback: drafts.slots?.[1]?.feedback || '' },
      2: { quizit: drafts.slots?.[2]?.quizit || '', reasoning: drafts.slots?.[2]?.reasoning || '', feedback: drafts.slots?.[2]?.feedback || '' },
      3: { quizit: drafts.slots?.[3]?.quizit || '', reasoning: drafts.slots?.[3]?.reasoning || '', feedback: drafts.slots?.[3]?.feedback || '' },
      4: { quizit: drafts.slots?.[4]?.quizit || '', reasoning: drafts.slots?.[4]?.reasoning || '', feedback: drafts.slots?.[4]?.feedback || '' },
    };
    setCurrentHash(drafts.promptHash || null);
    setTestStates(nextStates);
    setQuizitResults(nextResults);
    setHasHydrated(true);
    
    // Set initial fields content hash after hydration
    const components = formData?.quizit_components ?? '';
    const wordsToAvoid = formData?.words_to_avoid ?? '';
    const initialHash = `${components}|${wordsToAvoid}`;
    setFieldsContentHash(initialHash);
    
    
  }, [drafts]);



  const handleTestClick = async (index) => {
    if (!formData?.quizit_components || !formData?.words_to_avoid || isTesting) return;
    setIsTesting(true);
    try {
      let hash = currentHash;
      if (!hash) {
        hash = await generateQuizitHash();
        setCurrentHash(hash);
      }
      
      // Create combined content for the AI
      const components = formData.quizit_components || '';
      const wordsToAvoid = formData.words_to_avoid || '';
      const combinedContent = `Components:\n${components}\n\nWords to Avoid:\n${wordsToAvoid}`;
      

      
      const { data, error } = await supabase.functions.invoke('quizit-generate', {
        body: { 
          components: formData.quizit_components || '',
          wordsToAvoid: formData.words_to_avoid || ''
        }
      });
      if (error) {
        console.error('Error generating quizit:', error);
        alert('Failed to generate. Please try again.');
        return;
      }
      const { quizit = '', reasoning = '' } = (data?.data || data) || {};
      setQuizitResults(prev => ({
        ...prev,
        [index]: { quizit, reasoning, feedback: prev[index]?.feedback || '' }
      }));
      setTestStates(prev => ({
        ...prev,
        [index]: { ...prev[index], isTested: true }
      }));
      // Emit aggregated drafts upward for save-time persistence
      const localResults = {
        ...quizitResults,
        [index]: { quizit, reasoning, feedback: quizitResults[index]?.feedback || '' }
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
    
    const components = formData?.quizit_components ?? '';
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
          4: { isTested: false, isConfirmed: false }
        };
        const clearedResults = {
          0: { quizit: '', reasoning: '', feedback: '' },
          1: { quizit: '', reasoning: '', feedback: '' },
          2: { quizit: '', reasoning: '', feedback: '' },
          3: { quizit: '', reasoning: '', feedback: '' },
          4: { quizit: '', reasoning: '', feedback: '' }
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
  }, [formData?.quizit_components, formData?.words_to_avoid, hasHydrated, fieldsContentHash]);

  // Reset slots only when the quizit fields actually change (not on mount/tab switch)
  useEffect(() => {
    // This is now handled by the fieldsContentHash tracking above
    // Keeping this for backward compatibility but it should not run
    return;
  }, [formData?.quizit_components, formData?.words_to_avoid, hasHydrated, currentHash, quizitResults]);

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
                    [0, 1, 2, 3, 4].filter(index => 
                      drafts.slots[index]?.isTested && drafts.slots[index]?.confirmed
                    ).length : 
                    [0, 1, 2, 3, 4].filter(index => 
                      testStates[index]?.isTested && testStates[index]?.confirmed
                    ).length;
                  
                  return confirmedCount;
                })()}/5
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
                  : 'Complete and confirm all 5 tests first'
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
              const hasChanges = (formData?.quizit_components ?? '') !== (savedPrompt?.quizit_components ?? '') || 
                                (formData?.words_to_avoid ?? '') !== (savedPrompt?.words_to_avoid ?? '');
              return hasChanges;
            })() && (
              <button
                onClick={async () => {
                  // Reset both new fields to saved values
                  handleInputChange('quizit_components', savedPrompt?.quizit_components || '');
                  handleInputChange('words_to_avoid', savedPrompt?.words_to_avoid || '');

                  // Reload saved tests from DB for the saved prompt
                  try {
                    // Generate hash from saved values
                    const components = savedPrompt?.quizit_components || '';
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
                        4: { isTested: false, isConfirmed: false }
                      };
                      const clearedResults = {
                        0: { quizit: '', reasoning: '', feedback: '' },
                        1: { quizit: '', reasoning: '', feedback: '' },
                        2: { quizit: '', reasoning: '', feedback: '' },
                        3: { quizit: '', reasoning: '', feedback: '' },
                        4: { quizit: '', reasoning: '', feedback: '' }
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
                      };
                      const nextResults = {
                        0: { quizit: '', reasoning: '', feedback: '' },
                        1: { quizit: '', reasoning: '', feedback: '' },
                        2: { quizit: '', reasoning: '', feedback: '' },
                        3: { quizit: '', reasoning: '', feedback: '' },
                        4: { quizit: '', reasoning: '', feedback: '' },
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
...`;
                
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quizit Components</label>
          <textarea
            ref={promptRef}
            value={(formData?.quizit_components) || ''}
            onChange={(e) => {
              handleInputChange('quizit_components', e.target.value);
            }}
            onInput={(e) => autoGrowEl(e.target)}
            className="w-full p-4 border border-gray-300 rounded overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ height: 'auto' }}
            placeholder="Enter what the quiz should contain and how it should be structured..."
          />
        </div>

        {/* Words/Phrases/Expressions to Avoid Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Words/Phrases/Expressions to Avoid</label>
          <textarea
            ref={wordsToAvoidRef}
            value={(formData?.words_to_avoid) || ''}
            onChange={(e) => {
              handleInputChange('words_to_avoid', e.target.value);
            }}
            onInput={(e) => autoGrowEl(e.target)}
            className="w-full p-4 border border-gray-300 rounded overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ height: 'auto' }}
            placeholder="Enter specific terms, concepts, and examples that should NOT be used in the generated scenarios..."
          />
        </div>
      </div>

      {/* Current Test Section */}
      <div className="bg-white rounded-lg p-6">
        {/* Test Navigation */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[0, 1, 2, 3, 4].map((index) => {
            const status = getTestStatus(index);
            const isActive = currentTestIndex === index;
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
                {/* no status text under tab */}
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
                disabled={!formData?.quizit_components || !formData?.words_to_avoid || isTesting}
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