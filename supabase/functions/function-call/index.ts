import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../transcribe/utils/cors.ts'

interface FunctionCallPayload {
  function: string;
  parameters: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError) throw userError
    if (!user) throw new Error('Not authenticated')

    // Parse request body
    const payload = await req.json() as FunctionCallPayload
    const { function: functionName, parameters } = payload

    console.log('Function call received:', { functionName, parameters })

    if (!functionName) {
      throw new Error('Missing function name')
    }

    // Handle createTemplate function
    if (functionName === 'createTemplate') {
      const { name, content } = parameters as { name: string; content: string }
      
      if (!name || !content) {
        throw new Error('Missing required parameters: name and content are required')
      }

      const { data, error: insertError } = await supabaseClient
        .from('templates')
        .insert({
          user_id: user.id,
          name: name,
          content: content,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting template:', insertError)
        throw insertError
      }

      console.log('Template created:', data)
      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Handle other functions here...
    throw new Error(`Unknown function: ${functionName}`)

  } catch (error) {
    console.error('Error in function-call:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})