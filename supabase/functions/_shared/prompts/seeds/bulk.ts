// Bulk Seed Generation Prompts
// For contributor platform - comprehensive seed bundle generation for card editing

import { CORE_SEED_PROMPT } from './core.ts';

// ===== BULK FUNCTIONS =====

// Helper function to build bulk seed generation prompt
export function buildBulkSeedPrompt(
  cardTitle: string,
  cardDescription: string,
  cardIdea: string,
  scenarioComponents: string[],
  count: number = 50
): string {
  const componentsText = scenarioComponents
    .map((comp, index) => `${index + 1}) ${comp}`)
    .join('\n');

  return `${CORE_SEED_PROMPT}

--- CONCEPT CARD ---
Title: ${cardTitle}
Description: ${cardDescription}
Card Idea: ${cardIdea}

--- SCENARIO COMPONENTS ---
${componentsText}

VOLUME
- Produce ${count} seed bundles total
- Each bundle has 3-5 items; each item is 1-3 words, lowercase
- Each bundle has 2-4 tags; each tag is 1-2 words, lowercase

INTERNAL METHOD
1) Derive a working lexicon from the card + components
2) Form micro-themes (metrics, user feedback, expert review, etc.)
3) Build bundles around ONE micro-theme each
4) Each bundle must include at least one signal/evidence item and one pressure/tone item
5) Generate descriptive tags for each bundle

CONSTRAINTS
- Items are noun phrases or simple nouns only (no verbs/gerunds unless lexicalized)
- Do NOT include any word/phrase already present in the scenario components
- Banned substrings (case-insensitive): ["meeting room","classroom","panel","stage","nodding","vendor","city","country","http","$","%"]
- Every bundle must pass a prototype sentence test (compose a 12-18 word sentence using all items)

Return JSON ONLY:
{
  "seed_bundles": [
    {
      "items": ["seed 1", "seed 2", "seed 3"],
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;
}
