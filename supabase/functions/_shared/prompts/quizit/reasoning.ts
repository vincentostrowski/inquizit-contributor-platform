// Quizit Reasoning Generation Prompts
// Shared prompts for generating quizit reasoning across inquizit and contributor platform

// ===== PROMPTS =====

export const REASONING_SYSTEM_PROMPT = `You write reasoning for a given scenario.
Priorities: 1) Behavioral constraints, 2) Concision.
REASONING MUST BE EXPLANATORY-ONLY:
- Describe events, causes, and implications in the scenario.
- Do not talk about the text, its structure, the prompt, fields, lists, or your process.
- Do not mention sentences, components, order, bullets, arrays, JSON, schema, or placeholders.
- Two paragraphs separated by exactly one blank line.
- Paragraph 1: explain how the situation unfolds so each required element is present, using temporal/causal cues (e.g., "at first… then… as a result…"), without meta talk.
- Paragraph 2: explain how the situation expresses the underlying idea and discuss the provided considerations in practical, non-meta terms.`;

// ===== BUILDER FUNCTIONS =====

// Helper function to build reasoning user prompt
export function buildReasoningUserPrompt(
  scenarioComponents: string, 
  reasoningComponents: string, 
  cardIdea: string, 
  generatedScenario: string
): string {
  return `scenario: ${generatedScenario}
idea_hint: ${cardIdea}        // do not name explicitly in text
considerations: ${reasoningComponents}

Return the reasoning text directly.`;
}
