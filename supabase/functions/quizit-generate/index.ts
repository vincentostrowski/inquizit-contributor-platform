  // Refactored edge function for generating quizit scenarios
  // Input: { scenarioComponents: string, reasoningComponents: string, wordsToAvoid: string, cardIdea: string }
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
      const { scenarioComponents, reasoningComponents, wordsToAvoid, cardIdea } = await req.json()
      if (!scenarioComponents || typeof scenarioComponents !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing scenarioComponents' }),
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

    const system = `You write one short scenario ("quizit") to test a concept.
Priorities: 1) Valid JSON only, 2) Follow constraints, 3) Be concise.
Hard rules:
- Output JSON only with keys {quizit, reasoning}.
- Scenario is second person ("you…"), preserves given order; combine only consecutive items; ≤1 sentence per item.
- No filler lines.
- REASONING MUST BE EXPLANATORY-ONLY: describe events, causes, and implications in the scenario; do not talk about the text itself, its structure, the prompt, fields, or your generation process.
- DISALLOWED REASONING BEHAVIORS (examples, not keywords):
  1) Referring to text units (e.g., "the first sentence…", "the last line…").
  2) Mapping/aligning to scaffolding (e.g., "this matches the listed items", "this covers the second part").
  3) Mentioning artifacts of formatting or schema (e.g., "in the JSON…", "in this field…").
  4) Self-referential process talk (e.g., "I wrote…", "the prompt says…").
  5) Labeling with placeholders ("Person A/B", "component", "anchor", etc.).
- If any rule is violated on your first attempt, silently revise once and re-emit.`
    
    const user = `Write a concise scenario. ≤1 sentence per required item; combine only consecutive items. Total 2–6 sentences.

Concept (refer implicitly; do not name it outright):
${cardIdea}

Items IN ORDER (array):
${scenarioComponents}

Banned phrases (array) [optional, may omit to save tokens]:
${wordsToAvoid}

Return strictly:
{"quizit":"...","reasoning":"..."}

quizit: second person; follow item order; 80–140 words; no filler.
reasoning: two paragraphs separated by exactly one blank line (\\n\\n).
  • Paragraph 1: Explain, in plain language, how the situation unfolds such that each required element is present—in order—using natural temporal/causal cues (e.g., "at first… then… as a result…"). Do not reference the text, its structure, or any scaffolding.
  • Paragraph 2: Explain how the situation expresses the underlying idea and discuss the provided considerations in practical terms. Do not reference the text, its structure, or any scaffolding.`

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


