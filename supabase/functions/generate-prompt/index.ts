import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse, buildClaudePrompt, createContentBatches } from '../shared/utils.ts'
import { GenerateCardsRequest, ClaudeResponse } from '../shared/types.ts'

interface GeneratePromptRequest {
  sectionId: number
  bookId: number
}

interface ProcessAIResponseRequest {
  sectionId: number
  bookId: number
  claudeResponse: ClaudeResponse
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...data } = await req.json()

    if (action === 'generate-prompt') {
      return await handleGeneratePrompt(data as GeneratePromptRequest, req)
    } else if (action === 'process-response') {
      return await handleProcessResponse(data as ProcessClaudeResponseRequest, req)
    } else {
      return createErrorResponse('Invalid action. Use "generate-prompt" or "process-response"', 400)
    }

  } catch (error) {
    console.error('Error in generate-prompt function:', error)
    return createErrorResponse('Internal server error')
  }
})

async function handleGeneratePrompt({ sectionId, bookId }: GeneratePromptRequest, req: Request) {
  console.log('handleGeneratePrompt called with:', { sectionId, bookId });
  
  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Step 1: Fetch section data
  console.log('Fetching section data for ID:', sectionId);
  const { data: section, error: sectionError } = await supabaseClient
    .from('source_sections')
    .select('*')
    .eq('id', sectionId)
    .single()

  console.log('Section fetch result:', { section, sectionError });

  if (sectionError || !section) {
    console.error('Section not found:', sectionError);
    return createErrorResponse('Section not found')
  }

  // Step 2: Fetch source snippets for the section
  const { data: snippets, error: snippetsError } = await supabaseClient
    .from('source_snippets')
    .select('*')
    .eq('section_id', sectionId)
    .order('order', { ascending: true })

  if (snippetsError) {
    return createErrorResponse('Failed to fetch snippets')
  }

  // Step 3: Fetch existing cards that reference this section
  const { data: existingCards, error: existingCardsError } = await supabaseClient
    .from('cards')
    .select(`
      *,
      card_source_references!inner (
        id,
        source_section_id,
        source_snippet_id,
        char_start,
        char_end
      )
    `)
    .in('card_source_references.source_section_id', [sectionId])

  if (existingCardsError) {
    return createErrorResponse('Failed to fetch existing cards')
  }

  // Step 4: Get remaining cards that reference multiple sections (for prompt context)
  const remainingCards = existingCards?.filter(card => {
    const references = card.card_source_references
    return references.length > 1 || references[0].source_section_id !== sectionId
  }) || []

  // Step 5: Create content batches
  const contentBatches = createContentBatches(snippets, 98000)
  
  // Step 6: Generate prompts for each batch
  const prompts = contentBatches.map((batch, index) => {
    const batchContent = batch.content.join('\n\n')
    return {
      batchNumber: index + 1,
      totalBatches: contentBatches.length,
      prompt: buildClaudePrompt(section.title, batchContent, sectionId, batch.snippets, remainingCards, index + 1, contentBatches.length),
      characterCount: batchContent.length
    }
  })

  return createSuccessResponse({
    sectionTitle: section.title,
    totalSnippets: snippets.length,
    totalCharacters: snippets.reduce((sum, s) => sum + s.content.length, 0),
    batches: prompts
  }, 'Prompt generated successfully')
}

async function handleProcessResponse({ sectionId, bookId, claudeResponse }: ProcessAIResponseRequest, req: Request) {
  // Initialize Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Validate the response structure
  if (!claudeResponse.cards || !Array.isArray(claudeResponse.cards)) {
    return createErrorResponse('Invalid AI response: missing or invalid cards array')
  }

  if (!claudeResponse.references || !Array.isArray(claudeResponse.references)) {
    return createErrorResponse('Invalid AI response: missing or invalid references array')
  }

  // Save cards to database
  const { data: savedCards, error: cardsError } = await supabaseClient
    .from('cards')
    .insert(claudeResponse.cards.map(card => ({
      ...card,
      book: bookId
    })))
    .select()

  if (cardsError) {
    console.error('Error saving cards:', cardsError)
    return createErrorResponse('Failed to save cards')
  }

  // Save references to database
  const referencesWithCardIds = claudeResponse.references.map((ref, index) => ({
    ...ref,
    card_id: savedCards[index].id
  }))

  const { error: refsError } = await supabaseClient
    .from('card_source_references')
    .insert(referencesWithCardIds)

  if (refsError) {
    console.error('Error saving references:', refsError)
    return createErrorResponse('Failed to save references')
  }

  return createSuccessResponse({
    cardsCount: savedCards.length,
    cards: savedCards
  }, 'Cards saved successfully')
} 