import React, { useState } from 'react';
import ThemeInjectionsLibrary from './ThemeInjectionsLibrary';

const ThemeInjectionsSection = ({
  formData,
  themeInjections,
  setThemeInjections
}) => {
  // Local state for copy feedback
  const [themeInjectionsPromptCopied, setThemeInjectionsPromptCopied] = useState(false);
  const [pasteError, setPasteError] = useState(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Validate theme injection structure
  const validateThemeInjections = (data) => {
    if (!data || typeof data !== 'object') {
      return 'Invalid JSON: Root must be an object';
    }

    if (!data.theme_injections || !Array.isArray(data.theme_injections)) {
      return 'Invalid JSON: Must have a "theme_injections" array';
    }

    if (data.theme_injections.length === 0) {
      return 'Invalid JSON: Theme injections array cannot be empty';
    }

    // Validate each theme injection
    for (let i = 0; i < data.theme_injections.length; i++) {
      const injection = data.theme_injections[i];
      
      if (!injection.id || typeof injection.id !== 'number') {
        return `Invalid JSON: Theme injection ${i + 1} must have a valid "id" number`;
      }
      
      if (!injection.text || typeof injection.text !== 'string') {
        return `Invalid JSON: Theme injection ${i + 1} must have a valid "text" string`;
      }
      
      if (!Array.isArray(injection.tags)) {
        return `Invalid JSON: Theme injection ${i + 1} must have a "tags" array`;
      }
      
      if (!Array.isArray(injection.children)) {
        return `Invalid JSON: Theme injection ${i + 1} must have a "children" array`;
      }

      // Validate children
      for (let j = 0; j < injection.children.length; j++) {
        const child = injection.children[j];
        
        if (!child.id || typeof child.id !== 'string') {
          return `Invalid JSON: Child ${j + 1} of theme injection ${i + 1} must have a valid "id" string`;
        }
        
        if (!child.text || typeof child.text !== 'string') {
          return `Invalid JSON: Child ${j + 1} of theme injection ${i + 1} must have a valid "text" string`;
        }
        
        if (!Array.isArray(child.tags)) {
          return `Invalid JSON: Child ${j + 1} of theme injection ${i + 1} must have a "tags" array`;
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
      const validationError = validateThemeInjections(parsedData);
      if (validationError) {
        setPasteError(validationError);
        return;
      }

      // Apply the theme injections
      setThemeInjections(parsedData);
      setPasteSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasteSuccess(false), 3000);
      
    } catch (parseError) {
      setPasteError('Invalid JSON: ' + parseError.message);
    }
  };

  // Handle copying theme injections prompt to clipboard
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
    
    const instructions = `You are given a concept card and its explanation. Generate theme injections for this concept.

Theme injections are specific scenarios or situations that would help test whether someone understands the concept. They should be concrete, realistic situations that someone might encounter.

Generate 5 root theme injections, each with 5 child variations. Each theme injection should:

1. Be a specific, concrete scenario involving people
2. Be relevant to testing understanding of the concept
3. Have descriptive tags for categorization
4. Include child variations that explore different aspects

Return your response as a JSON structure with this exact format:

{
  "theme_injections": [
    {
      "id": 1,
      "text": "Person A notices broad agreement to copy a competitor's feature set rather than pursue a distinct product thesis",
      "tags": ["consensus", "product-strategy", "competition", "differentiation"],
      "children": [
        {
          "id": "1a",
          "text": "As PM, Person A challenges a directive to clone a rival's AI summaries and proposes a workflow built for compliance-heavy customers",
          "tags": ["product-management", "ai", "regulated-industries", "workflow"]
        },
        {
          "id": "1b", 
          "text": "During roadmap review, Person A suggests dropping parity epics to run a 6-week spike on a mobile field-mode used by technicians",
          "tags": ["roadmap", "experimentation", "mobile", "field-ops"]
        },
        {
          "id": "1c",
          "text": "Person A runs discovery interviews showing enterprise admins value auditability over new widgets, reframing the quarter's priorities",
          "tags": ["user-research", "enterprise", "auditability", "prioritization"]
        },
        {
          "id": "1d",
          "text": "Person A proposes a vertical-specific onboarding flow instead of generic feature demos, targeting compliance-heavy industries",
          "tags": ["onboarding", "vertical-saas", "compliance", "customization"]
        },
        {
          "id": "1e",
          "text": "Person A advocates for a partnership with industry-specific consultants rather than building everything in-house",
          "tags": ["partnerships", "consultants", "industry-expertise", "outsourcing"]
        }
      ]
    }
  ]
}

Requirements:
- Each root theme injection needs: id (number), text (string), tags (array), children (array)
- Each child needs: id (string like "1a", "1b", etc.), text (string), tags (array)
- Generate exactly 5 root theme injections with exactly 5 children each
- All text should be concrete scenarios involving people
- Tags should be descriptive and help categorize the scenario
- Focus on situations that would test deep understanding of the concept`;
    
    const payload = `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
    navigator.clipboard.writeText(payload);
    setThemeInjectionsPromptCopied(true);
    setTimeout(() => setThemeInjectionsPromptCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Theme Injections</label>
        </div>
        {themeInjections && themeInjections.theme_injections.length > 0 ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setThemeInjections('');
              }}
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
      {(!themeInjections || themeInjections.theme_injections.length === 0) ? (
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
              <div className="text-green-500 text-sm mb-1">✓ Theme injections loaded successfully!</div>
            ) : (
              <>
                <div className="text-gray-500 text-sm mb-1">Click to paste theme injections JSON</div>
                <div className="text-gray-400 text-xs">Press Ctrl+V (or Cmd+V) to paste</div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Theme Injections Library - Show when data exists */
        <div className="mt-3">
          <ThemeInjectionsLibrary
            themeInjectionsData={themeInjections}
          />
        </div>
      )}
    </div>
  );
};  

export default ThemeInjectionsSection;
