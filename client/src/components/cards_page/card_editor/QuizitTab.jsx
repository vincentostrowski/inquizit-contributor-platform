import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../services/supabaseClient';

const QuizitTab = ({ formData, handleInputChange, handleGenerate, onTestsDraftChange, savedPrompt, drafts, cardId }) => {
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
  const quizitRef = useRef(null);
  const reasoningRef = useRef(null);
  const promptRef = useRef(null);
  const lastLoadedHashRef = useRef(null);
  const prevPromptRef = useRef(formData?.prompt ?? '');

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
  }, [drafts]);

  const handleTestClick = async (index) => {
    if (!formData?.prompt || isTesting) return;
    setIsTesting(true);
    try {
      let hash = currentHash;
      if (!hash) {
        hash = await sha256(formData.prompt || '');
        setCurrentHash(hash);
      }
      const { data, error } = await supabase.functions.invoke('quizit-generate', {
        body: { prompt: formData.prompt }
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

  // Reset slots only when the prompt text actually changes (not on mount/tab switch)
  useEffect(() => {
    const saved = savedPrompt ?? '';
    const current = formData?.prompt ?? '';
    const prev = prevPromptRef.current;
    if (current !== prev) {
      // Only clear if diverging from saved prompt; otherwise (revert), keep/hydrate
      if (current !== saved) {
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
      }
      prevPromptRef.current = current;
    }
  }, [formData?.prompt, savedPrompt]);

  // When prompt equals saved prompt, auto-load saved tests from drafts or DB if local is empty
  useEffect(() => {
    const maybeLoadSaved = async () => {
      if (!cardId) return;
      const saved = savedPrompt ?? '';
      const current = formData?.prompt ?? '';
      if (current !== saved) return;
      const hash = await sha256(saved || '');
      const hasAnyLocal = [0,1,2,3,4].some(i => {
        const r = quizitResults[i];
        const s = testStates[i];
        return (r?.quizit || r?.reasoning || r?.feedback || s?.isTested || s?.isConfirmed);
      });
      if (hasAnyLocal) return;

      // Try drafts first if matching hash
      if (drafts?.promptHash === hash) {
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
        setCurrentHash(hash);
        setTestStates(nextStates);
        setQuizitResults(nextResults);
        emitDraftChange(hash, nextResults, nextStates);
        lastLoadedHashRef.current = hash;
        return;
      }

      try {
        // If we have already successfully loaded this hash and local is still empty, we can skip
        if (lastLoadedHashRef.current === hash) return;
        const { data, error } = await supabase
          .from('card_prompt_tests')
          .select('slot, quizit, reasoning, feedback, confirmed')
          .eq('card_id', cardId)
          .eq('prompt_hash', hash)
          .order('slot', { ascending: true });
        if (error) {
          console.error('Error loading saved tests on revert:', error);
          return;
        }
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
        (data || []).forEach(row => {
          nextStates[row.slot] = { isTested: !!(row.quizit || row.reasoning), isConfirmed: !!row.confirmed };
          nextResults[row.slot] = { quizit: row.quizit || '', reasoning: row.reasoning || '', feedback: row.feedback || '' };
        });
        setCurrentHash(hash);
        setTestStates(nextStates);
        setQuizitResults(nextResults);
        emitDraftChange(hash, nextResults, nextStates);
        lastLoadedHashRef.current = hash;
      } catch (e) {
        console.error('Unexpected error loading saved tests on revert:', e);
      }
    };
    maybeLoadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.prompt, savedPrompt, cardId]);

  // Auto-grow textareas on value changes
  useEffect(() => {
    if (testStates[currentTestIndex]?.isTested) {
      autoGrowEl(quizitRef.current);
      autoGrowEl(reasoningRef.current);
    }
    autoGrowEl(promptRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTestIndex, testStates[currentTestIndex]?.isTested, quizitResults[currentTestIndex]?.quizit, quizitResults[currentTestIndex]?.reasoning]);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Prompt Input Section */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="font-medium text-lg">Prompt</label>
          <div className="flex items-center space-x-2">
            {cardId && ((formData?.prompt ?? '') !== (savedPrompt ?? '')) && (
              <button
                onClick={async () => {
                  // Reset prompt text first
                  handleInputChange('prompt', savedPrompt || '');

                  // Reload saved tests from DB for the saved prompt
                  try {
                    const hash = await sha256(savedPrompt || '');
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
                    } else {
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
                      (data || []).forEach(row => {
                        nextStates[row.slot] = { isTested: !!(row.quizit || row.reasoning), isConfirmed: !!row.confirmed };
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
                const instructions = `You are given:\n\n- A **concept card** and\n- A **full explanatory write-up** of the idea from that card\n\n---\n\n### 🧠 Your Task\n\nWrite a prompt that will later be used to generate **multiple realistic scenarios** where the concept is relevant — without ever being named.\n\nThe goal of the prompt you write is to create situations that **test whether a reader can recognize and apply the concept on their own**.\n\n---\n\n### ✅ The Prompt You Write Should:\n\n- Ask for a **short and realistic scenario** (approximately 100 words)\n- Ask that the scenario be written in **second person** (“you notice...”) so that the **reader is the one placed in the situation**\n- Clearly **instruct not to use or reference any keywords, phrases, or examples** from the original concept or text (extract these from the card and content, and instruct for the created prompt to ask for them to not be used)\n- Ask for a situation where the concept is **present but hidden** — so that recognizing it requires thought, not recall\n- Prompt should be general-purpose — **no mention of specific workplaces, roles, industries, etc.**`;
                const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
                navigator.clipboard.writeText(payload);
                setPromptCopied(true);
                setTimeout(() => setPromptCopied(false), 2000);
              }}
              className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <span>Prompt</span>
              {promptCopied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <textarea
          ref={promptRef}
          value={(formData?.prompt) || ''}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          onInput={(e) => autoGrowEl(e.target)}
          className="w-full p-4 border border-gray-300 rounded overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ height: 'auto' }}
          placeholder="Enter your quiz prompt here..."
        />
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
                disabled={!formData?.prompt || isTesting}
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