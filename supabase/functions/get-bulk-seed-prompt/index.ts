// Edge function for getting bulk seed generation prompt
// Input: { cardTitle: string, cardDescription: string, cardIdea: string, scenarioComponents: string[], count?: number }
// Output: { prompt: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { buildBulkSeedPrompt } from '../_shared/prompts/seeds/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cardTitle, cardDescription, cardIdea, scenarioComponents, count = 50 } = await req.json()
    
    // Validate required parameters
    if (!cardTitle || !cardDescription || !cardIdea) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: cardTitle, cardDescription, cardIdea' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(scenarioComponents)) {
      return new Response(
        JSON.stringify({ error: 'scenarioComponents must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Generate the prompt using centralized function
    const prompt = buildBulkSeedPrompt(cardTitle, cardDescription, cardIdea, scenarioComponents, count)
    
    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in get-bulk-seed-prompt function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
