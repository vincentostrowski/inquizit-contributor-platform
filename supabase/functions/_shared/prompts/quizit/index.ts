// Quizit Prompts - Contributor Platform Server
// Exports all quizit-related prompts for use in contributor platform edge functions

// Scenario prompts
export {
  SCENARIO_SYSTEM_PROMPT,
  buildScenarioUserPrompt,
  buildScenarioUserPromptPairedCards
} from './scenario.ts';

// Reasoning prompts
export {
  REASONING_SYSTEM_PROMPT,
  buildReasoningUserPrompt
} from './reasoning.ts';