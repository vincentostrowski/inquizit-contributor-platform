import React, { useState } from 'react';
import PastInterface from './scenario_components_section/PastInterface';
import ScenarioComponents from './scenario_components_section/ScenarioComponents';
import ReasoningComponents from './scenario_components_section/ReasoningComponents';
import AddButton from './scenario_components_section/AddButton';
import Dependencies from './scenario_components_section/Dependencies';
import Permutations from './scenario_components_section/Permutations';

const generateQuizitPrompt = (formData) => {
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
  
  return `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
};

// Copy prompt to clipboard and show feedback
const copyPromptToClipboard = async (formData, setPromptCopied) => {
  try {
    const payload = generateQuizitPrompt(formData);
    await navigator.clipboard.writeText(payload);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  } catch (error) {
    console.error('Failed to copy prompt:', error);
  }
};

// Reset component structure and permutations
const handleResetComponents = (onComponentStructureChange, onPermutationsChange) => {
  onComponentStructureChange({ components: [] });
  onPermutationsChange(new Set());
};

const QuizitComponentsSection = ({ 
  formData, 
  componentStructure, 
  onComponentStructureChange,
  selectedPermutations,
  onPermutationsChange  
}) => {
  // Local state for copy feedback
  const [promptCopied, setPromptCopied] = useState(false);

  const reasoningComponents = componentStructure?.components?.filter(component => component.type === 'reasoning');
  const scenarioComponents = componentStructure?.components?.filter(component => component.type === 'scenario');
  
  return (
    <div className="bg-white rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="font-medium">Quizit Components</label>
        </div>
        {componentStructure?.components?.length > 0 ? (
          <button
            onClick={() => handleResetComponents(onComponentStructureChange, onPermutationsChange)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
            title="Reset quizit components"
          >
            Reset
          </button>
        ) : (
          <button
            onClick={() => copyPromptToClipboard(formData, setPromptCopied)}
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
        )}
      </div>
      {componentStructure && componentStructure.components && componentStructure.components.length > 0 ? (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
          <div className="space-y-4 mb-4">
            <ScenarioComponents components={scenarioComponents} onComponentStructureChange={onComponentStructureChange} />
            <ReasoningComponents components={reasoningComponents} onComponentStructureChange={onComponentStructureChange} />
            <AddButton onComponentStructureChange={onComponentStructureChange} />
            <Dependencies components={componentStructure.components || []} onComponentStructureChange={onComponentStructureChange} />
            <Permutations components={componentStructure.components || []} selectedPermutations={selectedPermutations} onPermutationsChange={onPermutationsChange} />
          </div>
        </div>
        ) : (
          <PastInterface onComponentStructureChange={onComponentStructureChange} />
        )}
    </div>
  );
};

export default QuizitComponentsSection;
