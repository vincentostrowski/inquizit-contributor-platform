// Edge function for generating quizit scenarios only
// Input: { coreComponents: string[], hintComponents: string[], wordsToAvoid: string, seedBundle: string[], theme?: string }
// Output: JSON { core: string[], hint: string[] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  SCENARIO_SYSTEM_PROMPT, 
  buildScenarioUserPrompt 
} from '../_shared/prompts/quizit/index.ts'

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
    const { coreComponents, hintComponents, wordsToAvoid, seedBundle, theme } = await req.json()
    
    // Validate coreComponents (required)
    if (!coreComponents || !Array.isArray(coreComponents)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid coreComponents array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate hintComponents (optional, but if provided must be array)
    if (hintComponents && !Array.isArray(hintComponents)) {
      return new Response(
        JSON.stringify({ error: 'hintComponents must be an array if provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the prompt for scenario generation using centralized prompts
    // TODO: Update buildScenarioUserPrompt to handle separate core/hint arrays
    const userPrompt = buildScenarioUserPrompt(coreComponents, hintComponents, wordsToAvoid, seedBundle || [], theme);

    // Log the final prompt for debugging
    console.log('Sending to ChatGPT:', userPrompt)

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
          { role: 'system', content: SCENARIO_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
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

    // Parse the JSON response from AI
    try {
      const parsedResponse = JSON.parse(generatedContent)
      
      // Validate the response structure
      if (!parsedResponse.core || !Array.isArray(parsedResponse.core)) {
        return new Response(
          JSON.stringify({ error: 'Invalid response format: missing or invalid core array' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // hint array is optional, but if present must be array
      if (parsedResponse.hint && !Array.isArray(parsedResponse.hint)) {
        return new Response(
          JSON.stringify({ error: 'Invalid response format: hint must be an array if present' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return the structured JSON response
      return new Response(
        JSON.stringify(parsedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response as JSON' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
