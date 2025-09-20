// Quizit Scenario Generation Prompts
// Shared prompts for generating quizit scenarios across inquizit and contributor platform

// ===== PROMPTS =====

export const SCENARIO_SYSTEM_PROMPT = `You write one short scenario ("quizit") to test concept(s).
Priorities: 1) Follow constraints, 2) Be concise.
Rules:
- Second person ("you…").
- Preserve given item ORDER, the order of the items should be how they appear in the scenario; combine only consecutive items.
- ≤1 sentence per item (fewer allowed via combining). 
- No filler, no labels.
- Treat banned phrases as case-insensitive; avoid inflections/near-variants.`;

// ===== BUILDER FUNCTIONS =====

// Helper function to build scenario user prompt for single card
export function buildScenarioUserPrompt(
  scenarioComponents: string, 
  wordsToAvoid: string, 
  seedBundle: string[] = []
): string {
  const seedBundleString = seedBundle.join(', ');
  
  const seedBundleSection = seedBundleString 
    ? `seed_bundle: ${seedBundleString}

The scenario should incorporate these seed words naturally and implement concrete details beyond them. Use the seed bundle as inspiration for the scenario context and build the scenario around these themes.`
    : '';

  return `items_in_order: ${scenarioComponents}
banned_phrases: ${wordsToAvoid}
${seedBundleSection}

Return the scenario text directly.`;
}

// Helper function to build scenario user prompt for paired cards
export function buildScenarioUserPromptPairedCards(
  scenarioComponents1: string, 
  wordsToAvoid1: string, 
  scenarioComponents2: string, 
  wordsToAvoid2: string, 
  seedBundle: string[] = []
): string {
  const seedBundleString = seedBundle.join(', ');
  
  const seedBundleSection = seedBundleString 
    ? `seed_bundle: ${seedBundleString}

The scenario should incorporate these seed words naturally and implement concrete details beyond them. Use the seed bundle as inspiration for the scenario context and build the scenario around these themes.`
    : '';

  return `items_in_order: ${scenarioComponents1}, ${scenarioComponents2}
banned_phrases: ${wordsToAvoid1}, ${wordsToAvoid2}
${seedBundleSection}

Return the scenario text directly.`;
}
