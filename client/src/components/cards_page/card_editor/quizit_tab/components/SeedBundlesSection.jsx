import React, { useState } from 'react';
import { supabase } from '../../../../../services/supabaseClient';

const SeedBundlesSection = ({
  formData,
  seedBundles,
  setSeedBundles,
  componentStructure
}) => {
  // Local state for copy feedback
  const [seedBundlesPromptCopied, setSeedBundlesPromptCopied] = useState(false);
  const [pasteError, setPasteError] = useState(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  // Get all unique tags from seed bundles
  const getAllTags = () => {
    if (!seedBundles?.seed_bundles) return [];
    const allTags = new Set();
    seedBundles.seed_bundles.forEach(bundle => {
      if (bundle.tags && Array.isArray(bundle.tags)) {
        bundle.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

  // Filter bundles based on selected tags
  const getFilteredBundles = () => {
    if (!seedBundles?.seed_bundles) return [];
    if (selectedTags.length === 0) return seedBundles.seed_bundles;
    
    return seedBundles.seed_bundles.filter(bundle => {
      if (!bundle.tags || !Array.isArray(bundle.tags)) return false;
      return selectedTags.some(tag => bundle.tags.includes(tag));
    });
  };

  // Handle tag selection
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all selected tags
  const clearTagFilter = () => {
    setSelectedTags([]);
  };

  // Validate seed bundles structure
  const validateSeedBundles = (data) => {
    if (!data || typeof data !== 'object') {
      return 'Invalid JSON: Root must be an object';
    }

    if (!data.seed_bundles || !Array.isArray(data.seed_bundles)) {
      return 'Invalid JSON: Must have a "seed_bundles" array';
    }

    if (data.seed_bundles.length === 0) {
      return 'Invalid JSON: Seed bundles array cannot be empty';
    }

    // Validate each seed bundle
    for (let i = 0; i < data.seed_bundles.length; i++) {
      const bundle = data.seed_bundles[i];
      
      if (!bundle.items || !Array.isArray(bundle.items)) {
        return `Invalid JSON: Seed bundle ${i + 1} must have an "items" array`;
      }
      
      if (bundle.items.length === 0) {
        return `Invalid JSON: Seed bundle ${i + 1} items array cannot be empty`;
      }

      // Validate each item is a string
      for (let j = 0; j < bundle.items.length; j++) {
        if (typeof bundle.items[j] !== 'string') {
          return `Invalid JSON: Seed bundle ${i + 1}, item ${j + 1} must be a string`;
        }
      }

      if (!bundle.tags || !Array.isArray(bundle.tags)) {
        return `Invalid JSON: Seed bundle ${i + 1} must have a "tags" array`;
      }

      // Validate each tag is a string
      for (let j = 0; j < bundle.tags.length; j++) {
        if (typeof bundle.tags[j] !== 'string') {
          return `Invalid JSON: Seed bundle ${i + 1}, tag ${j + 1} must be a string`;
        }
      }
    }

    return null; // No errors
  };

  // Handle paste functionality
  const handlePaste = async (pastedText) => {
    setPasteError(null);
    setPasteSuccess(false);

    try {
      // Parse JSON
      const parsedData = JSON.parse(pastedText);
      
      // Validate structure
      const validationError = validateSeedBundles(parsedData);
      if (validationError) {
        setPasteError(validationError);
        return;
      }

      // Apply the seed bundles
      setSeedBundles(parsedData);
      setPasteSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasteSuccess(false), 3000);
      
    } catch (parseError) {
      setPasteError('Invalid JSON: ' + parseError.message);
    }
  };

  // Handle copying seed bundles prompt to clipboard
  const handleCopySeedBundlesPrompt = async () => {
    try {
      // Extract scenario components
      const scenarioComponents = componentStructure?.components
        ?.filter(component => component.type === 'scenario')
        ?.map(component => component.text) || [];

      // Call the centralized prompt service
      const { data, error } = await supabase.functions.invoke('get-bulk-seed-prompt', {
        body: {
          cardTitle: formData?.title || 'N/A',
          cardDescription: formData?.description || 'N/A',
          cardIdea: formData?.card_idea || 'N/A',
          scenarioComponents,
          count: 50
        }
      });

      if (error) {
        console.error('Failed to get prompt:', error);
        return;
      }

      navigator.clipboard.writeText(data.prompt);
      setSeedBundlesPromptCopied(true);
      setTimeout(() => setSeedBundlesPromptCopied(false), 2000);
    } catch (error) {
      console.error('Failed to get prompt:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Seed Bundles</label>
        </div>
        {seedBundles && seedBundles.seed_bundles && seedBundles.seed_bundles.length > 0 ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSeedBundles({ seed_bundles: [] });
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              title="Reset seed bundles"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={handleCopySeedBundlesPrompt}
            className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
            title="Copy seed bundles prompt to clipboard"
          >
            {seedBundlesPromptCopied ? (
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
      {(!seedBundles || seedBundles.seed_bundles.length === 0) ? (
        <div 
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            handlePaste(pastedText);
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
              e.preventDefault();
              navigator.clipboard.readText().then(text => {
                handlePaste(text);
              });
            }
          }}
          tabIndex={0}
          className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="text-center">
            {pasteError ? (
              <div className="text-red-500 text-sm mb-1">{pasteError}</div>
            ) : pasteSuccess ? (
              <div className="text-green-500 text-sm mb-1">✓ Seed bundles loaded successfully!</div>
            ) : (
              <>
                <div className="text-gray-500 text-sm mb-1">Paste seed bundles JSON here</div>
                <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
          {/* Tag Filter */}
          {getAllTags().length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Filter by tags:</h4>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearTagFilter}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {getAllTags().map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Display seed bundles */}
          <div className="text-xs text-gray-500 mb-2">
            {selectedTags.length > 0 
              ? `Showing ${getFilteredBundles().length} of ${seedBundles.seed_bundles.length} bundles`
              : `${seedBundles.seed_bundles.length} bundles`
            }
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getFilteredBundles().map((bundle, index) => {
              // Find the original index in the full array
              const originalIndex = seedBundles.seed_bundles.findIndex(b => b === bundle);
              return (
                <div key={originalIndex} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Bundle {originalIndex + 1}</span>
                  </div>
                
                <div className="mb-2">
                  <div className="text-sm text-gray-700">
                    <strong>Items:</strong> {bundle.items.join(', ')}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">
                    <strong>Tags:</strong> {bundle.tags.join(', ')}
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeedBundlesSection;
