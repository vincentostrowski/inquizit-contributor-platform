import React, { useState } from 'react';

const WordsToAvoidSection = ({
  formData,
  wordsToAvoid,
  setWordsToAvoid
}) => {
  // Local state for copy feedback
  const [wordsPromptCopied, setWordsPromptCopied] = useState(false);
  // Get words to avoid as array
  const getWordsArray = () => {
    return Array.isArray(wordsToAvoid) ? wordsToAvoid : [];
  };

  // Handle adding new word to avoid
  const handleAddWordToAvoid = () => {
    try {
      const currentWords = Array.isArray(wordsToAvoid) ? wordsToAvoid : [];;
      const newWords = [...currentWords, ''];
      setWordsToAvoid(newWords);
      
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
      const currentWords = getWordsArray();
      const newWords = currentWords.filter((_, i) => i !== wordIndex);
      setWordsToAvoid(newWords);
    } catch (error) {
      console.error('Error deleting word to avoid:', error);
    }
  };

  // Handle copying words prompt to clipboard
  const handleCopyWordsPrompt = () => {
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
  };

  // Handle resetting words to avoid
  const handleResetWordsToAvoid = () => {
    setWordsToAvoid([]);
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Words/Phrases/Expressions to Avoid</label>
        </div>
        {wordsToAvoid && wordsToAvoid.length > 0 ? (
          <button
            onClick={handleResetWordsToAvoid}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="Reset words to avoid"
          >
            Reset
          </button>
        ) : (
          <button
            onClick={handleCopyWordsPrompt}
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
      {!wordsToAvoid || wordsToAvoid.length === 0 ? (
        <div 
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            const words = pastedText.split(/[\n,]+/).map(word => word.trim()).filter(word => word.length > 0);
            setWordsToAvoid(words);
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
              e.preventDefault();
              navigator.clipboard.readText().then(text => {
                const words = text.split(/[\n,]+/).map(word => word.trim()).filter(word => word.length > 0);
                setWordsToAvoid(words);
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
              const words = getWordsArray();
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
                                setWordsToAvoid(newWords);
                                
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
  );
};

export default WordsToAvoidSection;
