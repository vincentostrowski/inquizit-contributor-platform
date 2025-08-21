// Refactored edge function for generating quizit scenarios
// Input: { components: string, wordsToAvoid: string }
// Output: { quizit: string, reasoning: string }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { components, wordsToAvoid } = await req.json()
    if (!components || typeof components !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing components' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing OPENAI_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const system = `You are a JSON-only responder. You ALWAYS return a single JSON object with exactly two string fields: "quizit" and "reasoning". No markdown, no prose outside JSON, no extra keys.`
    
    const user = `Write a concise scenario written in second person ("you..."), in which the central idea is present but never directly named. Use a maximum of one sentence per component, but if possible, combine multiple components into single sentences. The scenario should present these components in the exact order they appear below.

The scenario should incorporate these key elements:
${components}

Do not use or reference any of the following words, phrases, or examples:
${wordsToAvoid}

Keep descriptive language minimal and purposeful. Every sentence must directly address at least one of the key components above. Avoid sentences that are purely atmospheric or don't contribute to the core scenario. Follow the component order exactly as listed.

Return strictly JSON as:
{"quizit":"...","reasoning":"..."}

For the reasoning field, explain how someone would recognize the underlying concept in this situation and how they would use that concept to reason about or react to what's happening.`

    // Log the final prompt for debugging
    console.log('Sending to ChatGPT:', user);

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        top_p: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      })
    })

    if (!resp.ok) {
      const errTxt = await resp.text().catch(() => '')
      return new Response(
        JSON.stringify({ error: 'OpenAI request failed', details: errTxt }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await resp.json()
    const content: string = data?.choices?.[0]?.message?.content || ''

    let parsed: { quizit?: string; reasoning?: string } = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      const start = content.indexOf('{')
      const end = content.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        try { parsed = JSON.parse(content.slice(start, end + 1)) } catch {}
      }
    }

    if (!parsed.quizit || !parsed.reasoning) {
      return new Response(
        JSON.stringify({ error: 'Model did not return valid JSON', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ quizit: parsed.quizit, reasoning: parsed.reasoning }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


