import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { handleCreateTemplate } from './handlers/templateHandler.ts'
import { handleAddPatient } from './handlers/patientHandler.ts'
import { handleStartLiveSession, handleFetchLastVisit } from './handlers/sessionHandler.ts'
import { handleSearchHistory } from './handlers/searchHandler.ts'
import type { FunctionCallPayload, FunctionResponse } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Execute requested function
    let result: FunctionResponse
    switch (functionName) {
      case 'createTemplate':
        result = await handleCreateTemplate(parameters, user.id, supabaseClient)
        break
      case 'addPatient':
        result = await handleAddPatient(parameters, user.id, supabaseClient)
        break
      case 'startLiveSession':
        result = await handleStartLiveSession(parameters, user.id, supabaseClient)
        break
      case 'searchHistory':
        result = await handleSearchHistory(parameters, user.id, supabaseClient)
        break
      case 'fetchLastVisit':
        result = await handleFetchLastVisit(parameters, user.id, supabaseClient)
        break
      default:
        throw new Error(`Unknown function: ${functionName}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
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