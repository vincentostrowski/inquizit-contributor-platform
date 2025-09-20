import React, { useState } from 'react';
import PastInterface from './scenario_components_section/PastInterface';
import ScenarioComponents from './scenario_components_section/ScenarioComponents';
import ReasoningComponents from './scenario_components_section/ReasoningComponents';
import AddButton from './scenario_components_section/AddButton';
import Dependencies from './scenario_components_section/Dependencies';
import Permutations from './scenario_components_section/Permutations';

const generateComponentsPrompt = (formData) => {
  const cardJson = {
    card: {
      title: formData?.title || '',
      description: formData?.description || '',
      card_idea: formData?.card_idea || ''
    },
    content: formData?.content || ''
  };
  
  const instructions = `You are given a concept card.

Task
Generate:
A) Atomic SCENARIO components (numbered)
B) Atomic REASONING components (numbered)

These MUST be GENERAL to all situations where the concept applies (setting-agnostic).

Output format (exactly this, no extra text):
Scenario components:
1) <12–20 words, one idea, people-centered, setting-agnostic>
2) ...
Reasoning components:
1) <8–16 words, one idea, setting-agnostic>
2) ...

Rules (both lists)
- One sentence per line, ONE idea only (avoid joining with "and/but").
- Concrete human actions/states (perception, judgment, decision, expression). No names, brands, locations, job titles, URLs, exact numbers.
- No meta terms ("scenario", "component", "concept", etc.).
- Use natural wording (shared vocabulary will be enforced later).
- Setting-agnostic: valid if alone, with one other person, or among others; avoid scene details.

Definitions
- SCENARIO = observable human situations you could depict on screen.
- REASONING = considerations a reader weighs to interpret/justify the scene (not necessarily shown).

Example (Sunk Cost Fallacy — general, setting-agnostic)

Scenario components:
1) Person A has already invested time, money, effort, or resources in a project.
2) Person A faces a clear decision point to continue the effort or to stop now.
3) Person A observes evidence suggesting continued effort is unlikely to be worthwhile.
4) Person A feels compelled to continue to avoid "wasting" what was already invested.

Reasoning components:
1) The reader recognizes past investment is irrecoverable and irrelevant to the current choice.
2) The reader evaluates expected future payoff rather than justifying prior effort.`;
  
  return `${instructions}\n\n---\n\nCard JSON:\n${JSON.stringify(cardJson, null, 2)}`;
};

const generateNormalizePrompt = () => {
  const instructions = `Use the lists in the immediately preceding message as input. Do NOT ask me to paste them again.

TASK
Normalize and finalize a vector-friendly configuration:
1) Select the best 6–8 SCENARIO components from the prior list (if fewer exist, keep all).
2) (Optional) Select 2–5 REASONING components if they clearly aid interpretation; skip if none were listed.
3) Order SCENARIO so prerequisites appear first (setup → signal/evidence → decision/action → outcome/response).
4) Set dependencies: for each item, fill "prerequisites" with earlier IDs it depends on.
5) Normalize all selected items to the rules below.
6) Emit FINAL JSON only (no commentary).

INPUT FORMAT (from the prior message)
- Parse numbered lines under "Scenario components:" as SCENARIO drafts.
- Parse numbered lines under "Reasoning components:" as REASONING drafts (if present).
- If only one list exists, treat it as SCENARIO.

NORMALIZATION — SCENARIO (strict)
- Sentence form: Subject + canonical_verb + object/context [+ optional short phrase].
- Allowed subjects ONLY: "Person A", "Person B", "a group of people", "others".
- Exactly ONE verb per sentence from this controlled lexicon (map synonyms to these):
  observes, questions, challenges, decides, hesitates, accepts, rejects, defers, revises, invests, commits, signals
- 12–20 words. Simple present. No hedging (really, very, somewhat, maybe, kind of).
- Setting-agnostic: avoid scene anchors (rooms, meetings, audiences, body language).
- Remove names, brands, locations, job titles, exact numbers, and URLs.

NORMALIZATION — REASONING (lighter)
- Subject: "Person A" or "the reader".
- ONE verb from this lexicon (map synonyms to these):
  evaluates, considers, compares, weighs, infers, anticipates, updates, generalizes, distinguishes, identifies
- 8–16 words. Simple present. Avoid prescriptions like "should"; use "considers/weighs/evaluates".
- Keep setting-agnostic; no names/brands/locations/URLs/exact numbers.

SELECTION HEURISTICS
- SCENARIO should collectively cover: setup/context, signal/evidence, decision point, action/response, immediate outcome.
- Remove near-duplicates; keep the clearest phrasing.
- REASONING should cover at least two distinct buckets: diagnostic cues, decision criteria, counterfactuals, principles, metacognition.

JSON SCHEMA (emit JSON ONLY, no commentary)
{
  "components": [
    {
      "id": "A",
      "text": "…",                    // normalized sentence
      "type": "scenario" | "reasoning",
      "isPrerequisite": true/false,   // usually false for reasoning
      "prerequisites": []             // IDs of earlier items this depends on
    }
  ]
}

ID & DEPENDENCY RULES
- Use letters A, B, C… sequentially across the whole list (scenario items first, then reasoning).
- "prerequisites" must reference earlier IDs only.
- Include "prerequisites" for every item (empty array if none).
- Scenario items must NOT depend on reasoning items.

SELF-CHECK (do internally; if any check fails, silently repair once and re-emit JSON)
- IDs sequential and unique (A..Z).
- SCENARIO: allowed subject, exactly one scenario verb, 12–20 words.
- REASONING: allowed subject, one reasoning verb, 8–16 words.
- Prerequisite references valid and earlier.
- No forbidden specifics or scene anchors remain.`;
  
  return instructions;
};

// Copy prompt to clipboard and show feedback

const copyComponentsPromptToClipboard = async (formData, setComponentsPromptCopied) => {
  try {
    const payload = generateComponentsPrompt(formData);
    await navigator.clipboard.writeText(payload);
    setComponentsPromptCopied(true);
    setTimeout(() => setComponentsPromptCopied(false), 2000);
  } catch (error) {
    console.error('Failed to copy components prompt:', error);
  }
};

const copyNormalizePromptToClipboard = async (setNormalizePromptCopied) => {
  try {
    const payload = generateNormalizePrompt();
    await navigator.clipboard.writeText(payload);
    setNormalizePromptCopied(true);
    setTimeout(() => setNormalizePromptCopied(false), 2000);
  } catch (error) {
    console.error('Failed to copy normalize prompt:', error);
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
  const [componentsPromptCopied, setComponentsPromptCopied] = useState(false);
  const [normalizePromptCopied, setNormalizePromptCopied] = useState(false);

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
          <div className="flex items-center space-x-2">
            {/* Components Prompt Button */}
            <button
              onClick={() => copyComponentsPromptToClipboard(formData, setComponentsPromptCopied)}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
              title="Copy components prompt to clipboard"
            >
              {componentsPromptCopied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>Components</span>
            </button>

            {/* Normalize Prompt Button */}
            <button
              onClick={() => copyNormalizePromptToClipboard(setNormalizePromptCopied)}
              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
              title="Copy normalize prompt to clipboard"
            >
              {normalizePromptCopied ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>Normalize</span>
            </button>
          </div>
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
