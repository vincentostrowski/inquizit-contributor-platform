import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../../services/supabaseClient';
import { generateValidOrderings } from '../../../../../utils/dependencyUtils';

// Color mapping for permutations
const getPermutationColor = (permutation, allPermutations) => {
  const colors = [
    'text-blue-600',
    'text-green-600', 
    'text-purple-600',
    'text-orange-600',
    'text-pink-600',
    'text-indigo-600',
    'text-yellow-600',
    'text-red-600',
    'text-teal-600',
    'text-cyan-600'
  ];
  
  // Sort permutations to get consistent order
  const sortedPermutations = [...allPermutations].sort();
  const index = sortedPermutations.indexOf(permutation);
  
  return colors[index % colors.length] || 'text-gray-600';
};

// Auto-resize textarea hook
const useAutoResize = (value) => {
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);
  
  return textareaRef;
};

// Test management functions
const createEmptyTestResults = () => {
  const results = {};
  [0, 1, 2, 3, 4, 5].forEach(index => {
    results[index] = { 
      quizit: '', 
      reasoning: '', 
      permutation: null,
      themeInjection: null, 
      confirmed: false
    };
  });
  return results;
};

const TestSection = (
    {
    formData,
    componentStructure,
    selectedPermutations,
    themeInjections,
    wordsToAvoid,
    tests,
    setTests,
    clearAndMapTests,
    }
) => {

    const [selectedTestIndex, setSelectedTestIndex] = useState(0);
    const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
    const [isGeneratingReasoning, setIsGeneratingReasoning] = useState(false);
    
    // Auto-resize refs
    const quizitTextareaRef = useAutoResize(tests[selectedTestIndex]?.quizit || '');
    const reasoningTextareaRef = useAutoResize(tests[selectedTestIndex]?.reasoning || '');

    // Reset tests function
    const handleResetTests = () => {
        if (clearAndMapTests) {
            clearAndMapTests();
        } else {
            const resetTests = createEmptyTestResults();
            setTests(resetTests);
        }
    };

    // Get current test data
    const currentTest = tests[selectedTestIndex];

    // Check if test can be generated (has required data)
    const canGenerateTest = () => {
        return currentTest.permutation && 
               currentTest.themeInjection && 
               componentStructure.components && componentStructure.components.length > 0;
    };

    // Generate test content (scenario + reasoning)
    const handleGenerateTest = async () => {
        if (!canGenerateTest()) return;

        try {
            // Step 1: Generate scenario
            setIsGeneratingScenario(true);
            
            // Extract scenario component texts from the permutation string
            const permutationIds = currentTest.permutation.split(' ');
            const scenarioComponents = permutationIds
                .map(id => {
                    const component = componentStructure.components.find(comp => comp.id === id && comp.type === 'scenario');
                    return component ? component.text : '';
                })
                .filter(text => text !== '')
                .join(', ');
            const wordsToAvoidString = wordsToAvoid ? wordsToAvoid.join(', ') : '';
            const themeInjectionText = currentTest.themeInjection.text || '';

            console.log('Generating scenario with:', {
                scenarioComponents,
                wordsToAvoidString,
                themeInjectionText
            });

            const { data: scenarioData, error: scenarioError } = await supabase.functions.invoke('quizit-scenario', {
                body: {
                    scenarioComponents,
                    wordsToAvoid: wordsToAvoidString,
                    themeInjection: themeInjectionText
                }
            });

            if (scenarioError) {
                console.error('Scenario generation error:', scenarioError);
                alert(`Error generating scenario: ${scenarioError.message}`);
                return;
            }

            // Update test with generated scenario
            const updatedTests = { ...tests };
            updatedTests[selectedTestIndex].quizit = scenarioData;
            setTests(updatedTests);
            setIsGeneratingScenario(false);

            // Step 2: Generate reasoning
            setIsGeneratingReasoning(true);

            // Extract reasoning component texts from the permutation string
            const reasoningComponents = componentStructure.components.filter(component => component.type === 'reasoning').map(component => component.text).join(', ');
            const cardIdea = formData.card_idea || '';

            console.log('Generating reasoning with:', {
                scenarioComponents,
                reasoningComponents,
                cardIdea,
                generatedQuizit: scenarioData
            });

            const { data: reasoningData, error: reasoningError } = await supabase.functions.invoke('quizit-reasoning', {
                body: {
                    scenarioComponents,
                    reasoningComponents,
                    cardIdea,
                    generatedQuizit: scenarioData
                }
            });

            if (reasoningError) {
                console.error('Reasoning generation error:', reasoningError);
                alert(`Error generating reasoning: ${reasoningError.message}`);
                return;
            }

            // Update test with generated reasoning
            const finalUpdatedTests = { ...tests };
            finalUpdatedTests[selectedTestIndex].reasoning = reasoningData;
            setTests(finalUpdatedTests);
            setIsGeneratingReasoning(false);

            console.log('Test generation completed successfully');

        } catch (error) {
            console.error('Unexpected error during test generation:', error);
            alert(`Unexpected error: ${error.message}`);
            setIsGeneratingScenario(false);
            setIsGeneratingReasoning(false);
        }
    };

  return (

  <div className="bg-white rounded-lg p-6">
  {/* Section Header with Reset Button */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-medium text-lg">Tests</h3>
    <button
          onClick={handleResetTests}
      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
      title="Reset all tests"
    >
      Reset
    </button>
  </div>
  
  {/* Test Navigation */}
  <div className="grid grid-cols-6 gap-2 mb-6">
    {[0, 1, 2, 3, 4, 5].map((index) => {
          const test = tests[index];
          const isConfirmed = test?.confirmed;
          const isGenerated = test?.quizit && test?.reasoning;
          const isSelected = selectedTestIndex === index;

          // Get all valid permutations for color mapping
          const scenarioComponents = componentStructure?.components?.filter(comp => comp.type === 'scenario') || [];
          const { validOrderings } = generateValidOrderings(scenarioComponents, 10);

      return (
        <button
          key={index}
              onClick={() => setSelectedTestIndex(index)}
              className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-1 transition-all duration-200 ${
                isConfirmed
                  ? isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-1 bg-green-100 border-green-200'
                    : 'bg-green-100 border-green-200 hover:bg-green-200'
                  : isGenerated
                  ? isSelected
                    ? 'ring-2 ring-blue-500 ring-offset-1 bg-yellow-100 border-yellow-200'
                    : 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200'
                  : isSelected
                  ? 'ring-2 ring-blue-500 ring-offset-1 bg-blue-50'
                  : 'border-gray-200 hover:shadow-md'
              }`}
              title={
                isConfirmed 
                  ? `Test ${index + 1} - Confirmed` 
                  : `Test ${index + 1} - ${test?.quizit ? 'Generated' : 'Not started'}`
              }
        >
          <span className="font-bold">Test {index + 1}</span>
              {test.permutation && (
            <span className={`text-[10px] font-mono leading-tight ${getPermutationColor(test.permutation, validOrderings)}`}>
                  {test.permutation}
            </span>
          )}
        </button>
      );
    })}
  </div>
  {/* removed right-side Tested badge */}

  <div className="space-y-4">
    {/* Theme Injection Display */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium mb-2">Theme Injection</h4>
          {currentTest.themeInjection ? (
            <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded p-3">
              {currentTest.themeInjection.text}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic bg-white border border-gray-200 rounded p-3">
              No theme injection assigned
            </div>
          )}
          </div>

    {/* Quizit Field */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-2">Generated Quizit</h4>
          {isGeneratingScenario ? (
            <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-blue-500 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Generating scenario...</span>
              </div>
            </div>
          ) : currentTest.quizit ? (
        <textarea
              ref={quizitTextareaRef}
              value={currentTest.quizit}
              onChange={(e) => {
                const updatedTests = { ...tests };
                updatedTests[selectedTestIndex].quizit = e.target.value;
                setTests(updatedTests);
              }}
          className="w-full p-3 border border-gray-200 rounded text-sm overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Generated quizit content..."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-gray-500">Click "Test" to generate quizit content...</div>
      )}
    </div>

    {/* Reasoning Field */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium mb-2">Reasoning</h4>
          {isGeneratingReasoning ? (
            <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-blue-500 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Generating reasoning...</span>
              </div>
            </div>
          ) : currentTest.reasoning ? (
        <textarea
              ref={reasoningTextareaRef}
              value={currentTest.reasoning}
              onChange={(e) => {
                const updatedTests = { ...tests };
                updatedTests[selectedTestIndex].reasoning = e.target.value;
                setTests(updatedTests);
              }}
          className="w-full p-3 border border-gray-200 rounded text-sm overflow-hidden resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Generated reasoning..."
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px] text-gray-500">Click "Test" to generate reasoning...</div>
      )}
    </div>



    {/* Action Buttons */}
    <div className="flex justify-center pt-4">
          {isGeneratingScenario || isGeneratingReasoning ? (
            // Placeholder div to maintain layout during generation
            <div className="px-6 py-2 text-white">
              ' '
            </div>
          ) : !currentTest.quizit ? (
        <button
              onClick={handleGenerateTest}
              disabled={!canGenerateTest()}
              className={`px-6 py-2 rounded ${
                canGenerateTest()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={
                !canGenerateTest() 
                  ? 'Missing required data (permutation, theme injection, or components)' 
                  : 'Generate test content'
              }
            >
              Test
        </button>
          ) : !currentTest.confirmed ? (
        <button
              onClick={() => {
                const updatedTests = { ...tests };
                updatedTests[selectedTestIndex].confirmed = true;
                setTests(updatedTests);
              }}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Confirm
        </button>
          ) : (
            <div className="text-green-600 text-sm font-medium">
              ✓ Confirmed
            </div>
          )}
    </div>
  </div>
  </div>
  );
};

export default TestSection;