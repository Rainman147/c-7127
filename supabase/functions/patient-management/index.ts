import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Patient management function called:', req.method)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()
    console.log('Action:', action, 'Params:', params)

    let result
    switch (action) {
      case 'searchPatients':
        result = await handleSearchPatients(params, user.id, supabaseClient)
        break
      case 'deletePatient':
        result = await handleDeletePatient(params, user.id, supabaseClient)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in patient-management function:', error)
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

async function handleSearchPatients(
  { query = '' }: { query?: string },
  userId: string,
  supabaseClient: any
) {
  console.log('Searching patients with query:', query)
  
  const { data, error } = await supabaseClient
    .from('patients')
    .select()
    .eq('user_id', userId)
    .ilike('name', `%${query}%`)
    .order('name')

  if (error) throw error
  console.log('Search results:', data)
  return { patients: data }
}

async function handleDeletePatient(
  { patientId }: { patientId: string },
  userId: string,
  supabaseClient: any
) {
  console.log('Deleting patient:', patientId)
  
  const { error } = await supabaseClient
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('user_id', userId)

  if (error) throw error
  return { success: true, message: 'Patient deleted successfully' }
}