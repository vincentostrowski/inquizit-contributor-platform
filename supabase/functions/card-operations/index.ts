import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../shared/utils.ts'
import { ClaudeResponse, DatabaseCard, DatabaseCardReference } from '../shared/types.ts'

interface SaveCardsRequest {
  claudeResponse: ClaudeResponse
  bookId: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { claudeResponse, bookId }: SaveCardsRequest = await req.json()

    if (!claudeResponse || !bookId) {
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

  } catch (error) {
    console.error('Error in card-operations function:', error)
    return createErrorResponse('Internal server error')
  }
}) 