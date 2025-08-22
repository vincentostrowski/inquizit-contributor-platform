// Edge function for generating quizit reasoning only
// Input: { scenarioComponents: string, reasoningComponents: string, cardIdea: string, generatedQuizit: string }
// Output: string (plain text reasoning)

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
    if (!generatedQuizit || typeof generatedQuizit !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing generatedQuizit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate other parameters (make them optional but provide defaults)
    const safeReasoningComponents = reasoningComponents || '';
    const safeCardIdea = cardIdea || '';

    // Create the prompt for reasoning generation
    const system = `You write reasoning for a given scenario.
Priorities: 1) Behavioral constraints, 2) Concision.
REASONING MUST BE EXPLANATORY-ONLY:
- Describe events, causes, and implications in the scenario.
- Do not talk about the text, its structure, the prompt, fields, lists, or your process.
- Do not mention sentences, components, order, bullets, arrays, JSON, schema, or placeholders.
- Two paragraphs separated by exactly one blank line.
- Paragraph 1: explain how the situation unfolds so each required element is present, using temporal/causal cues (e.g., "at first… then… as a result…"), without meta talk.
- Paragraph 2: explain how the situation expresses the underlying idea and discuss the provided considerations in practical, non-meta terms.`

    const user = `scenario: ${generatedQuizit}
idea_hint: ${safeCardIdea}        // do not name explicitly in text
considerations: ${safeReasoningComponents}

Return the reasoning text directly.`

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
