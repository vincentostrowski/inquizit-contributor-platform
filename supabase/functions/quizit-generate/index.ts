// Minimal edge function for testing Prompt tab
// Input: { prompt: string }
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
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing prompt' }),
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
    const user = `Write a single realistic scenario (90-120 words) in second person ("you...") where the concept is present but hidden. Do NOT name the concept or use any keywords/phrases/examples from the source. Keep it general-purpose with no specific industry/role.\n\nReturn strictly JSON as:\n{"quizit":"...","reasoning":"..."}\n\nPrompt:\n${prompt}`

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


