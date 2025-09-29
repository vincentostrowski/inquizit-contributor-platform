// Edge function for generating quizit reasoning only
// Input: { scenarioComponents: string, reasoningComponents: string, cardIdea: string, generatedQuizit: { core: string[], hint: string[] } }
// Output: string (plain text reasoning)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  REASONING_SYSTEM_PROMPT, 
  buildReasoningUserPrompt 
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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('Failed to parse request JSON:', jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { scenarioComponents, reasoningComponents, cardIdea, generatedQuizit } = requestBody;
    
    // Log received parameters for debugging
    console.log('Received parameters:', { 
      scenarioComponents: !!scenarioComponents, 
      reasoningComponents: !!reasoningComponents, 
      cardIdea: !!cardIdea, 
      generatedQuizit: !!generatedQuizit 
    });
    
    if (!scenarioComponents || typeof scenarioComponents !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing scenarioComponents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!generatedQuizit || typeof generatedQuizit !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid generatedQuizit object' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate the structure of generatedQuizit
    if (!generatedQuizit.core || !Array.isArray(generatedQuizit.core)) {
      return new Response(
        JSON.stringify({ error: 'generatedQuizit must have a core array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // hint array is optional, but if present must be array
    if (generatedQuizit.hint && !Array.isArray(generatedQuizit.hint)) {
      return new Response(
        JSON.stringify({ error: 'generatedQuizit hint must be an array if present' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate other parameters (make them optional but provide defaults)
    const safeReasoningComponents = reasoningComponents || '';
    const safeCardIdea = cardIdea || '';
    
    // Convert JSON object to string: core sentences followed by hint sentences
    const allScenarios = [...generatedQuizit.core, ...(generatedQuizit.hint || [])];
    const generatedQuizitString = allScenarios.join(' ');

    // Create the prompt for reasoning generation using centralized prompts
    const userPrompt = buildReasoningUserPrompt(scenarioComponents, safeReasoningComponents, safeCardIdea, generatedQuizitString);

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
          { role: 'system', content: REASONING_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate reasoning' }),
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
    console.error('Error in quizit-reasoning function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
