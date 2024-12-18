import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { function: functionName, parameters } = await req.json() as FunctionCallPayload
    console.log('Function call received:', { functionName, parameters })

    if (!functionName) {
      throw new Error('Missing function name')
    }

    // Handle createTemplate function
    if (functionName === 'createTemplate') {
      const { templateName, content } = parameters
      
      if (!templateName || !content) {
        throw new Error('Missing required parameters: templateName and content are required')
      }

      const { data, error: insertError } = await supabaseClient
        .from('templates')
        .insert({
          user_id: user.id,
          name: templateName,
          content: content,
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log('Template created:', data)
      return new Response(
        JSON.stringify(data),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Handle other functions here...
    throw new Error(`Unknown function: ${functionName}`)

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
})