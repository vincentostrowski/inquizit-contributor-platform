// Quizit Scenario Generation Prompts
// Shared prompts for generating quizit scenarios across inquizit and contributor platform

// ===== PROMPTS =====

export const SCENARIO_SYSTEM_PROMPT = `You write one short scenario ("quizit") to test concept(s).
Priorities: 1) Follow constraints, 2) Be concise, 3) Create engaging scenarios using seed elements and user theme (when provided).

Rules:
- Second person ("you…").
- Preserve given item ORDER within each component group, the order of the items should be how they appear.
- ≤1 sentence per item (fewer allowed via combining core group components into sentences with commas). 
- No filler filler sentences, however DETAILS / CONCRETENESS are to be added. 
- Treat banned phrases as case-insensitive; avoid inflections/near-variants.
- Use seed bundle elements as core building blocks for your scenario.
- When a user theme is provided, incorporate it to provide relevant context and personal relevance.
- Create cohesive scenarios that blend the concept being tested with the provided seed elements and user theme (if available).
- Don't repeat or directly reference the user's theme in the scenario - use it as context to create relevant situations without being overly referential.
- DO NOT combine items across core and hint groups - only combine consecutive items within the CORE group if appropriate, and do so by using commas.

Detail Requirements:
- Transform abstract components into specific, detailed sentences with concrete details.
- Replace generic references like "Person B" with specific characters (names, roles, relationships) (Person A = you).
- Add enough detail to make the scenario engaging and memorable while maintaining conciseness.

Output Format:
Return JSON with this exact structure:
{
  "core": ["sentence1", "sentence2", "sentence3"],
  "hint": ["sentence1", "sentence2"]
}

- "core" contains sentences that were generated from core components (always present)
- "hint" contains sentences that were generated from hint components (can be empty array if no hint components provided)
- Preserve the order of the items in the core and hint groups.
- You can ONLY combine consecutive items within the core group.

Component Combination with Commas:
If you have core components: "Person A notices flaws", "Person A recognizes contradictions", "Person A hesitates to share"
You can combine them as: "You notice flaws in the approach, recognize contradictions in the logic, but hesitate to share your concerns because you risk rejection."

Example:
Input:
core_components_in_order: Person A has already invested time, money, effort, or resources in a project, Person A faces a clear decision point to continue the effort or to stop now, Person A observes evidence suggesting continued effort is unlikely to be worthwhile
hint_components_in_order: Person A feels compelled to continue to avoid "wasting" what was already invested
banned_phrases: sunk cost, fallacy, bias
seed_bundle: home renovation, contractor, over budget
user_theme: I am renovating my first home and learning about project management

Output:
{
  "core": [
    "You've already spent $45,000 on your kitchen renovation.",
    "Your contractor, Mike, just discovered that the electrical wiring behind the walls is outdated and needs to be completely rewired for an additional $20,000."
  ],
  "hint": [
    "You realize that the total renovation cost will now exceed $60,000, which is more than the $50,000 you originally budgeted and nearly matches the current market value of your entire house.",
    "You feel compelled to continue because you've already invested so much time coordinating with suppliers and you don't want to 'waste' the custom cabinets that were specifically designed for this space."
  ]
}

Example 2:
Input:
core_components_in_order: Person A notices that nearly everyone in the group endorses a belief without question, Person A privately recognizes flaws or contradictions in the widely accepted belief
hint_components_in_order: Person A hesitates to share their perspective because it risks rejection or criticism from others
banned_phrases: contrarian, contrary
seed_bundle: workplace, team meeting, project deadline, manager
user_theme: I work in marketing at a tech company

Output:
{
  "core": [
    "During the weekly marketing standup everyone on your team immediately agrees that the new social media campaign should focus on Instagram Reels.",
    "You've noticed that the Instagram Reels approach has consistently underperformed for the past three months."
  ],
  "hint": [
    "You hesitate to bring up the performance data because the last person who challenged Sarah's ideas was moved to a different project."
  ]
}
  
Example 3: 
core_components_in_order: A, B, C
hint_components_in_order: D, E
core_components_in_order_2: F, G
hint_components_in_order_2: H, I

Output: 
{
  "core": [
    "< Sentence that uses A, B >, < Sentence that uses C >, < Sentence that uses F, G >" 
  ], 
  "hint": [
    "< Sentence that uses D >, < Sentence that uses E >, < Sentence that uses H >, < Sentence that uses I >"
  ]
}`;

// ===== BUILDER FUNCTIONS =====

// Helper function to build scenario user prompt for single card
export function buildScenarioUserPrompt(
  coreComponents: string[],
  hintComponents: string[],
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

  return `core_components_in_order: ${coreComponents.join(', ')}
hint_components_in_order: ${hintComponents.length > 0 ? hintComponents.join(', ') : 'None'}
banned_phrases: ${wordsToAvoid}
${seedBundleSection}
${themeSection}
${combinedSection}

Generate scenarios as JSON.`;
}

// Helper function to build scenario user prompt for paired cards
export function buildScenarioUserPromptPairedCards(
  coreComponents1: string[],
  hintComponents1: string[],
  wordsToAvoid1: string,
  coreComponents2: string[],
  hintComponents2: string[],
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

  return `core_components_in_order: ${coreComponents1.join(', ')}
hint_components_in_order: ${hintComponents1.length > 0 ? hintComponents1.join(', ') : 'None'}
core_components_in_order_2: ${coreComponents2.join(', ')}
hint_components_in_order_2: ${hintComponents2.length > 0 ? hintComponents2.join(', ') : 'None'}
banned_phrases: ${wordsToAvoid1}, ${wordsToAvoid2}
${seedBundleSection}
${themeSection}
${combinedSection}

Generate scenarios as JSON with this structure:
{
  "core": ["sentence1", "sentence2", "sentence3"],
  "hint": ["sentence1", "sentence2"]
}

The core and hint arrays should combine elements from both cards in a cohesive scenario.`;
}
