import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    let result

    switch (action) {
      case 'addPatient':
        result = await handleAddPatient(params, user.id, supabaseClient)
        break
      case 'searchPatients':
        result = await handleSearchPatients(params, user.id, supabaseClient)
        break
      case 'getPatient':
        result = await handleGetPatient(params, user.id, supabaseClient)
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

async function handleAddPatient(
  { name, dob, contactInfo = {}, medicalHistory, currentMedications = [], recentTests = [], address }: { 
    name: string; 
    dob: string; 
    contactInfo?: Record<string, unknown>;
    medicalHistory?: string;
    currentMedications?: unknown[];
    recentTests?: unknown[];
    address?: string;
  },
  userId: string,
  supabaseClient: any
) {
  console.log('Adding patient:', { name, dob, contactInfo, medicalHistory, currentMedications, recentTests, address })
  
  const { data, error } = await supabaseClient
    .from('patients')
    .insert({
      user_id: userId,
      name,
      dob,
      contact_info: contactInfo,
      medical_history: medicalHistory,
      current_medications: currentMedications,
      recent_tests: recentTests,
      address
    })
    .select()
    .single()

  if (error) throw error
  return { success: true, patient: data }
}

async function handleSearchPatients(
  { query }: { query: string },
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
  return { patients: data }
}

async function handleGetPatient(
  { patientId }: { patientId: string },
  userId: string,
  supabaseClient: any
) {
  console.log('Fetching patient:', patientId)
  
  const { data, error } = await supabaseClient
    .from('patients')
    .select()
    .eq('id', patientId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  if (!data) throw new Error('Patient not found')
  
  return { patient: data }
}