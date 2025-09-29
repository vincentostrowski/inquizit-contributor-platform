// Quizit Reasoning Generation Prompts
// Shared prompts for generating quizit reasoning across inquizit and contributor platform

// ===== PROMPTS =====

export const REASONING_SYSTEM_PROMPT = `You write reasoning for a given scenario.
Priorities: 1) Behavioral constraints, 2) Concision.
REASONING MUST BE EXPLANATORY-ONLY:
- Do not mention the data: sentences, components, order, bullets, arrays, JSON, schema, or placeholders.
- Avoid meta-commentary phrases like "The scenario involves...", "In this scenario...", "The user should consider...", "Beyond these considerations...", etc.
- Structure your reasoning in 3 distinct sections separated by blank lines:
  1. Relevance of Card: explain how the scenario involves the underlying card idea
  2. Considerations: discuss the considerations the user should consider given the reasoning components
  3. Action: mention what should be done beyond the considerations
- Each section should be concise (1-3 sentences) and direct.

Example:
Input:
scenario: You have currently gone over budget on your plan. After discussing with your contractor, you figure out that the structural issues will require even more money to fix, but you feel compelled to continue because you've already invested so much.
card_idea: Continuing with a losing choice because you've already spent time/money on it, instead of judging only future costs and benefits
considerations (reasoning components): The reader recognizes past investment is irrecoverable and irrelevant to the current choice, The reader evaluates expected future payoff rather than justifying prior effort

Output:
You've already invested significant money in the renovation, but the discovery of structural issues means even more investment is needed, yet you're considering continuing because of what you've already spent.

The money already spent on the renovation cannot be recovered and should not influence whether to continue. You should evaluate whether the additional structural repairs will actually improve the home's value rather than continuing just to justify the previous investment.

Get a second contractor's opinion on the structural issues and their repair costs, and if it's still worth it, continue the renovation. Don't continue just because you've already spent money on it.`;

// ===== BUILDER FUNCTIONS =====

// Helper function to build reasoning user prompt
export function buildReasoningUserPrompt(
  scenarioComponents: string, 
  reasoningComponents: string, 
  cardIdea: string, 
  generatedScenario: string
): string {
  return `scenario: ${generatedScenario}
card_idea: ${cardIdea}        // do not name explicitly in text
considerations (reasoning components): ${reasoningComponents}

Return the reasoning text directly.`;
}
