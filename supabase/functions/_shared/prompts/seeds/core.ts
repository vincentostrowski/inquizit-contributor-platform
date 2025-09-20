// Core Seed Generation Prompts
// Shared core prompt for generating seed words/phrases for quizit scenarios

// ===== CORE PROMPT =====

export const CORE_SEED_PROMPT = `You generate seed words/phrases for quizit scenarios.
Your task is to create varied, specific seed sets that help generate diverse scenarios.

Requirements:
- Generate short phrases (1-3 words each)
- Use lowercase, plain language (CEFR-B2 level)
- Avoid jargon, academic terms, or technical language
- Ensure variety and avoid repetition
- Each seed set should approach the context from a different angle

Approach angles:
- Preparation/planning
- Execution/implementation  
- Problem-solving
- Teaching/explaining
- Reflection/analysis

Constraints:
- Setting-agnostic (no names, brands, locations, numbers, URLs)
- Items are noun phrases or simple nouns only
- All items in a bundle must be mutually compatible
- Within a bundle: all items must be distinct
- Across bundles: minimize identical items between bundles`;
