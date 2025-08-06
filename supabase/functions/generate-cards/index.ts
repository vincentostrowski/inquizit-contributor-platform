import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse, buildClaudePrompt, createContentBatches } from '../shared/utils.ts'
import { GenerateCardsRequest, ClaudeResponse } from '../shared/types.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { sectionId, bookId }: GenerateCardsRequest = await req.json()

    // Validate required fields
    if (!sectionId || !bookId) {
      return createErrorResponse('Missing required fields', 400)
    }

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
    const { data: section, error: sectionError } = await supabaseClient
      .from('source_sections')
      .select('*')
      .eq('id', sectionId)
      .single()

    if (sectionError || !section) {
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

    // Step 4: Identify cards that ONLY reference this section (should be deleted)
    const cardsToDelete = existingCards?.filter(card => {
      const references = card.card_source_references
      return references.length === 1 && references[0].source_section_id === sectionId
    }) || []

    // Step 5: Delete cards that only reference this section
    if (cardsToDelete.length > 0) {
      const cardIdsToDelete = cardsToDelete.map(card => card.id)
      
      // Delete card_source_references first (due to foreign key constraints)
      const { error: refsDeleteError } = await supabaseClient
        .from('card_source_references')
        .delete()
        .in('card_id', cardIdsToDelete)

      if (refsDeleteError) {
        return createErrorResponse('Failed to delete existing card references')
      }

      // Delete the cards
      const { error: cardsDeleteError } = await supabaseClient
        .from('cards')
        .delete()
        .in('id', cardIdsToDelete)

      if (cardsDeleteError) {
        return createErrorResponse('Failed to delete existing cards')
      }
    }

    // Step 6: Get remaining cards that reference multiple sections (for prompt context)
    const remainingCards = existingCards?.filter(card => {
      const references = card.card_source_references
      return references.length > 1 || references[0].source_section_id !== sectionId
    }) || []

    // Step 7: Create content batches to handle 100k character limit
    const contentBatches = createContentBatches(snippets, 95000) // Leave 5k for prompt overhead
    let allGeneratedCards: any[] = []
    let allGeneratedReferences: any[] = []

    // Step 8: Process each batch
    for (let batchIndex = 0; batchIndex < contentBatches.length; batchIndex++) {
      const batch = contentBatches[batchIndex]
      const batchContent = batch.join('\n\n')
      
      console.log(`Processing batch ${batchIndex + 1} of ${contentBatches.length} (${batchContent.length} characters)`)

      // Call Claude API function for this batch
      const { data: claudeData, error: claudeError } = await supabaseClient.functions.invoke('claude-api', {
        body: {
          sectionId,
          sectionTitle: section.title,
          sectionContent: batchContent,
          existingCards: remainingCards,
          batchNumber: batchIndex + 1,
          totalBatches: contentBatches.length
        }
      })

      if (claudeError) {
        console.error(`Error calling Claude API for batch ${batchIndex + 1}:`, claudeError)
        return createErrorResponse(`Failed to generate cards for batch ${batchIndex + 1}`)
      }

      const claudeResponse: ClaudeResponse = claudeData.data

      // Accumulate cards and references from this batch
      allGeneratedCards.push(...claudeResponse.cards)
      allGeneratedReferences.push(...claudeResponse.references)
    }

    // Step 9: Save all generated cards to database
    if (allGeneratedCards.length > 0) {
      const { data: savedCards, error: cardsError } = await supabaseClient
        .from('cards')
        .insert(allGeneratedCards.map(card => ({
          ...card,
          book: bookId
        })))
        .select()

      if (cardsError) {
        console.error('Error saving cards:', cardsError)
        return createErrorResponse('Failed to save cards')
      }

      // Step 10: Save references to database
      const referencesWithCardIds = allGeneratedReferences.map((ref, index) => ({
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
        batchesProcessed: contentBatches.length
      }, `Cards generated successfully from ${contentBatches.length} batch${contentBatches.length > 1 ? 'es' : ''}`)
    } else {
      return createSuccessResponse({
        cardsCount: 0,
        batchesProcessed: contentBatches.length
      }, 'No cards generated')
    }

  } catch (error) {
    console.error('Error in generate-cards function:', error)
    return createErrorResponse('Internal server error')
  }
}) 