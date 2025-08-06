// Shared utilities for Supabase Edge Functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export function createResponse(data: any, status: number = 200) {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

export function createErrorResponse(error: string, status: number = 500) {
  return createResponse({ error }, status)
}

export function createSuccessResponse(data?: any, message?: string) {
  return createResponse({ 
    success: true, 
    data, 
    message 
  })
}

export function buildClaudePrompt(sectionTitle: string, sectionContent: string, sectionId: number, snippets: any[], existingCards?: any[], batchNumber?: number, totalBatches?: number) {
  const existingCardsContext = existingCards && existingCards.length > 0 
    ? `\n\nExisting cards for this section (avoid creating duplicates):
${existingCards.map(card => `- ${card.title}: ${card.description}`).join('\n')}`
    : '';

  const batchContext = batchNumber && totalBatches && totalBatches > 1
    ? `\n\nThis is batch ${batchNumber} of ${totalBatches} for this section. Focus on the content provided in this batch.`
    : '';

  // Create snippet reference information
  const snippetRefs = snippets.map((snippet, index) => 
    `Snippet ${index + 1} (ID: ${snippet.id}): ${snippet.content.substring(0, 100)}${snippet.content.length > 100 ? '...' : ''}`
  ).join('\n');

  return `You will be provided with a passage of non-fiction text. Your task is to extract the **core ideas** that the passage is **centered around** — not every idea mentioned.

Section ID: ${sectionId}

Each **concept card** must contain:

1. **Title** – A short, clear phrase capturing the essence of the idea (40-50 characters max).
2. **Description** – A paraphrased explanation of the concept (100-130 characters max).
3. **Source References** – A list of **logically precise references** (either line numbers or character spans) from the passage that the concept is derived from or supported by.

---

### **Instructions**

- Only extract **main ideas** that are **emphasized, developed, or repeated** in the passage.
- Do **not extract supporting examples**, anecdotes, historical details, or background information *unless they form the core of a larger idea*.
- Prefer **generalized concepts** over isolated facts.
- Produce as many cards as necessary — this could mean 1 or even 20 per 1000 words.

---

Section: ${sectionTitle}${batchContext}

Available Snippets:
${snippetRefs}

Content:
${sectionContent}${existingCardsContext}

Please create concept cards that:
1. Extract only the **core ideas** that the passage is centered around
2. Focus on **main ideas** that are emphasized, developed, or repeated
3. Avoid supporting examples, anecdotes, or background details unless they form the core of a larger idea
4. Prefer **generalized concepts** over isolated facts
5. Do NOT duplicate any existing cards listed above
6. Reference the specific snippet(s) that each card is based on

Return the response in this exact JSON format:
{
  "cards": [
    {
      "title": "Card Title", // 40-50 characters max
      "description": "Description of the concept", // 100-130 characters max
      "prompt": "",
      "order": 1,
      "card_idea": "Optional additional context",
      "banner": ""
    }
  ],
  "references": [
    {
      "card_id": 0,
      "source_section_id": ${sectionId}, // Use the Section ID provided above
      "source_snippet_id": 123,
      "char_start": 0,
      "char_end": 0
    }
  ]
}

IMPORTANT: 
- For each card, set "source_snippet_id" to the ID of the snippet that the card is primarily based on. You can find the snippet IDs in the "Available Snippets" section above.
- Set "source_section_id" to the Section ID provided above (${sectionId}).
- The "description" field should contain a paraphrased explanation of the concept, not just a brief description.
- **Title length:** Keep titles between 40-50 characters for optimal display.
- **Description length:** Keep descriptions between 100-130 characters for optimal display.
- Focus on extracting the **core ideas** that the passage is centered around, not every detail mentioned.`
}

export function createContentBatches(snippets: any[], maxChars: number = 95000): { content: string[], snippets: any[] }[] {
  const batches: { content: string[], snippets: any[] }[] = [];
  let currentBatchContent: string[] = [];
  let currentBatchSnippets: any[] = [];
  let currentBatchChars = 0;
  
  for (const snippet of snippets) {
    const snippetChars = snippet.content.length;
    
    // If adding this snippet would exceed the limit, start a new batch
    if (currentBatchChars + snippetChars > maxChars && currentBatchContent.length > 0) {
      batches.push({
        content: currentBatchContent,
        snippets: currentBatchSnippets
      });
      currentBatchContent = [snippet.content];
      currentBatchSnippets = [snippet];
      currentBatchChars = snippetChars;
    } else {
      currentBatchContent.push(snippet.content);
      currentBatchSnippets.push(snippet);
      currentBatchChars += snippetChars;
    }
  }
  
  // Add the last batch if it has content
  if (currentBatchContent.length > 0) {
    batches.push({
      content: currentBatchContent,
      snippets: currentBatchSnippets
    });
  }
  
  return batches;
} 