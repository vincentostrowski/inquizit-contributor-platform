// Quizit Scenario Generation Prompts
// Shared prompts for generating quizit scenarios across inquizit and contributor platform

// ===== PROMPTS =====

export const SCENARIO_SYSTEM_PROMPT = `You write one short scenario ("quizit") to test concept(s).
Priorities: 1) Follow constraints, 2) Be concise, 3) Create engaging scenarios using seed elements and user theme (when provided).

Rules:
- Second person ("you…").
- Preserve given item ORDER, the order of the items should be how they appear in the scenario; combine only consecutive items.
- ≤1 sentence per item (fewer allowed via combining). 
- No filler, no labels.
- Treat banned phrases as case-insensitive; avoid inflections/near-variants.
- Use seed bundle elements as core building blocks for your scenario.
- When a user theme is provided, incorporate it to provide relevant context and personal relevance.
- Create cohesive scenarios that blend the concept being tested with the provided seed elements and user theme (if available).
- Don't repeat or directly reference the user's theme in the scenario - use it as context to create relevant situations without being overly referential.

Example:
Input:
items_in_order: Person A has already invested time, money, effort, or resources in a project, Person A faces a clear decision point to continue the effort or to stop now, Person A observes evidence suggesting continued effort is unlikely to be worthwhile, Person A feels compelled to continue to avoid "wasting" what was already invested
banned_phrases: sunk cost, fallacy, bias
seed_bundle: home renovation, contractor, over budget
user_theme: I am renovating my first home and learning about project management

Output: "You have currently gone over budget on your plan. After discussing with your contractor, you figure out that the structural issues will require even more money to fix, but you feel compelled to continue because you've already invested so much."

Note: The scenario uses the theme context (home renovation) without repeating "I am renovating my first home..." - it just creates a relevant situation.`;

// ===== BUILDER FUNCTIONS =====

// Helper function to build scenario user prompt for single card
export function buildScenarioUserPrompt(
  scenarioComponents: string, 
  wordsToAvoid: string, 
  seedBundle: string[] = [],
  theme?: string
): string {
  const seedBundleString = seedBundle.join(', ');
  
  const seedBundleSection = seedBundleString 
    ? `seed_bundle: ${seedBundleString}

These seed words represent compressed scenario elements that were generated specifically for this card concept and user theme. They should be incorporated naturally as the core building blocks of your scenario.`
    : '';

  const themeSection = theme 
    ? `user_theme: ${theme}

This user theme provides the overall context and personal relevance for the scenario. The theme should guide the setting, tone, and specific details while the seed bundle provides the core scenario elements.`
    : '';

  const combinedSection = (seedBundleString && theme) 
    ? `

IMPORTANT: The seed bundle and user theme work together. The seeds were generated to create scenarios that blend this card concept with the user's theme. Use both the theme context and seed elements to create a cohesive, personalized scenario that tests the concept while being relevant to the user.`
    : '';

  return `items_in_order: ${scenarioComponents}
banned_phrases: ${wordsToAvoid}
${seedBundleSection}
${themeSection}
${combinedSection}

Return the scenario text directly.`;
}

// Helper function to build scenario user prompt for paired cards
export function buildScenarioUserPromptPairedCards(
  scenarioComponents1: string, 
  wordsToAvoid1: string, 
  scenarioComponents2: string, 
  wordsToAvoid2: string, 
  seedBundle: string[] = [],
  theme?: string
): string {
  const seedBundleString = seedBundle.join(', ');
  
  const seedBundleSection = seedBundleString 
    ? `seed_bundle: ${seedBundleString}

These seed words represent compressed scenario elements that were generated specifically for this card concept and user theme. They should be incorporated naturally as the core building blocks of your scenario.`
    : '';

  const themeSection = theme 
    ? `user_theme: ${theme}

This user theme provides the overall context and personal relevance for the scenario. The theme should guide the setting, tone, and specific details while the seed bundle provides the core scenario elements.`
    : '';

  const combinedSection = (seedBundleString && theme) 
    ? `

IMPORTANT: The seed bundle and user theme work together. The seeds were generated to create scenarios that blend this card concept with the user's theme. Use both the theme context and seed elements to create a cohesive, personalized scenario that tests the concept while being relevant to the user.`
    : '';

  return `items_in_order: ${scenarioComponents1}, ${scenarioComponents2}
banned_phrases: ${wordsToAvoid1}, ${wordsToAvoid2}
${seedBundleSection}
${themeSection}
${combinedSection}

Return the scenario text directly.`;
}
