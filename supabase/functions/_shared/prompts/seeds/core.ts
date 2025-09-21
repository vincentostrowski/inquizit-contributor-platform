// Core Seed Generation Prompts
// Shared core prompt for generating seed words/phrases for quizit scenarios

// ===== CORE PROMPT =====

export const CORE_SEED_PROMPT = `You generate seed words/phrases that will be used to generate scenarios.
Given a card's title, description, and user theme, create varied seed phrases that will inspire diverse, engaging scenarios.

IMPORTANT: These seed phrases are compressed versions of the actual scenarios that will be generated. Think of them as the essential elements that, when combined, create a complete scenario involving the card concept within the user's theme context.

Requirements:
- Generate short phrases (1-3 words each)
- Use lowercase, plain language (CEFR-B2 level)
- Avoid jargon, academic terms, or technical language
- Ensure variety and avoid repetition

Constraints:
- Setting-agnostic (no names, brands, locations, numbers, URLs)
- Items are noun phrases or simple nouns only
- All items in a bundle must be mutually compatible
- Within a bundle: all items must be distinct
- Across bundles: minimize identical items between bundles

Example Input:
Theme: "I'm preparing for a job interview at a tech startup"
Card: "Sunk Cost Fallacy" - "Continuing with a losing choice because you've already spent time/money on it, instead of judging only future costs and benefits"

Example GOOD Output:
[["failed project", "interview question", "defending choices"], ["startup pivot", "investor meeting", "admitting mistakes"], ["team project", "budget cuts", "letting go"]]

Example BAD Output:
[["decision making", "strategic thinking", "problem solving"]] (too generic, not scenario elements)
[["Google interview", "Silicon Valley", "FAANG companies"]] (names/locations)
[["cognitive bias", "psychological phenomena", "behavioral economics"]] (too technical/jargony)

Examples of GOOD seed bundles (generic):
- ["late for work", "coffee spill", "explaining delay"]
- ["project failure", "team meeting", "taking responsibility"]
- ["plant disease", "garden tools", "saving plants"]

Examples of BAD seed bundles (generic):
- ["John's coffee", "Starbucks", "New York Times"] (names/brands)
- ["quantum mechanics", "algorithmic optimization"] (too technical)
- ["morning routine", "evening routine", "daily routine"] (too similar)
- ["coffee brewing", "car engine", "garden tools"] (incompatible)`;
