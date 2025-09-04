// Edge function for generating quizit scenarios only
// Input: { scenarioComponents: string, wordsToAvoid: string }
// Output: string (plain text scenario)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { scenarioComponents, wordsToAvoid, seedBundle } = await req.json()
    if (!scenarioComponents || typeof scenarioComponents !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing scenarioComponents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the prompt for scenario generation
    const system = `You write one short scenario ("quizit") to test a concept.
Priorities: 1) Follow constraints, 2) Be concise.
Rules:
- Second person ("you…").
- Preserve given item ORDER, the order of the items should be how they appear in the scenario; combine only consecutive items.
- ≤1 sentence per item (fewer allowed via combining). 
- No filler, no labels.
- Treat banned phrases as case-insensitive; avoid inflections/near-variants.`

    const user = `You write one short scenario ("quizit") to test a concept.
Priorities: 1) Follow constraints, 2) Be concise.
Rules:
- Second person ("you…").
- Preserve given item ORDER, the order of the items should be how they appear in the scenario; combine only consecutive items.
- ≤1 sentence per item (fewer allowed via combining). 
- No filler, no labels.
- Treat banned phrases as case-insensitive; avoid inflections/near-variants.

items_in_order: ${scenarioComponents}
banned_phrases: ${wordsToAvoid}
${seedBundle ? `seed_bundle: ${seedBundle}

The scenario should incorporate these seed words naturally and implement concrete details beyond them. Use the seed bundle as inspiration for the scenario context and build the scenario around these themes.` : ''}

Return the scenario text directly.`

    // Log the final prompt for debugging
    console.log('Sending to ChatGPT:', user)

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate scenario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const generatedContent = openaiData.choices[0]?.message?.content

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return the generated content directly as plain text
    if (generatedContent && typeof generatedContent === 'string') {
      return new Response(
        generatedContent,
        { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
      )
    } else {
      return new Response(
        'No content generated',
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
      )
    }

  } catch (error) {
    console.error('Error in quizit-scenario function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
