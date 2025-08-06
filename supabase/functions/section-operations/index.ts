import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createErrorResponse, createSuccessResponse } from '../shared/utils.ts'

interface GetSectionSnippetsRequest {
  sectionId: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sectionId }: GetSectionSnippetsRequest = await req.json()

    if (!sectionId) {
      return createErrorResponse('Missing sectionId', 400)
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

    // Fetch source snippets for the section
    const { data: snippets, error: snippetsError } = await supabaseClient
      .from('source_snippets')
      .select('*')
      .eq('section_id', sectionId)
      .order('order', { ascending: true })

    if (snippetsError) {
      console.error('Error fetching snippets:', snippetsError)
      return createErrorResponse('Failed to fetch snippets')
    }

    return createSuccessResponse({
      snippets: snippets || []
    }, 'Snippets fetched successfully')

  } catch (error) {
    console.error('Error in section-operations function:', error)
    return createErrorResponse('Internal server error')
  }
}) 