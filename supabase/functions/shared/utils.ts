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

  return `Generate flashcards for the following educational content:

Section: ${sectionTitle}${batchContext}

Available Snippets:
${snippetRefs}

Content:
${sectionContent}${existingCardsContext}

Please create flashcards that:
1. Cover the key concepts and important details
2. Have clear, concise titles and descriptions
3. Are suitable for learning and review
4. Are engaging and educational
5. Do NOT duplicate any existing cards listed above
6. Reference the specific snippet(s) that each card is based on

Return the response in this exact JSON format:
{
  "cards": [
    {
      "title": "Card Title",
      "description": "Card description",
      "prompt": "Content/prompt for the card",
      "order": 1,
      "card_idea": "Optional additional context",
      "banner": ""
    }
  ],
  "references": [
    {
      "card_id": 0,
      "source_section_id": ${sectionId},
      "source_snippet_id": 123,
      "char_start": 0,
      "char_end": 0
    }
  ]
}

IMPORTANT: For each card, set "source_snippet_id" to the ID of the snippet that the card is primarily based on. You can find the snippet IDs in the "Available Snippets" section above.`
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