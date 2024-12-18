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

    // Execute requested function
    let result
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
      case 'exportToEHR':
        result = await handleExportToEHR(parameters, user.id, supabaseClient)
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

// Function handlers
async function handleCreateTemplate(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { templateName, sections, systemInstructions } = parameters as {
    templateName: string;
    sections: string[];
    systemInstructions: string;
  }

  if (!templateName || !sections) {
    throw new Error('Missing required parameters')
  }

  // Create template logic here
  console.log('Creating template:', { templateName, sections, userId })
  return {
    templateId: crypto.randomUUID(),
    name: templateName,
    success: true
  }
}

async function handleAddPatient(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { firstName, lastName, dateOfBirth, medicalRecordNumber } = parameters as {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
  }

  if (!firstName || !lastName || !dateOfBirth || !medicalRecordNumber) {
    throw new Error('Missing required parameters')
  }

  // Add patient logic here
  console.log('Adding patient:', { firstName, lastName, userId })
  return {
    patientId: crypto.randomUUID(),
    mrn: medicalRecordNumber,
    success: true
  }
}

async function handleStartLiveSession(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { patientId, templateId } = parameters as {
    patientId: string;
    templateId: string;
  }

  if (!patientId || !templateId) {
    throw new Error('Missing required parameters')
  }

  // Start session logic here
  console.log('Starting session:', { patientId, templateId, userId })
  return {
    sessionId: crypto.randomUUID(),
    startTime: new Date().toISOString(),
    status: 'active'
  }
}

async function handleSearchHistory(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { query, filters, dateRange } = parameters as {
    query: string;
    filters?: Record<string, unknown>;
    dateRange?: { start: string; end: string };
  }

  if (!query) {
    throw new Error('Missing required parameters')
  }

  // Search logic here
  console.log('Searching history:', { query, filters, userId })
  return {
    results: [],
    total: 0,
    page: 1
  }
}

async function handleFetchLastVisit(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { patientId, visitType } = parameters as {
    patientId: string;
    visitType?: 'all' | 'in-person' | 'telehealth';
  }

  if (!patientId) {
    throw new Error('Missing required parameters')
  }

  // Fetch last visit logic here
  console.log('Fetching last visit:', { patientId, visitType, userId })
  return {
    lastVisitDate: new Date().toISOString(),
    visitType: visitType || 'in-person',
    providerId: userId
  }
}

async function handleExportToEHR(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
) {
  const { sessionId, format, destination } = parameters as {
    sessionId: string;
    format: 'HL7' | 'FHIR' | 'PDF' | 'CDA';
    destination: string;
  }

  if (!sessionId || !format || !destination) {
    throw new Error('Missing required parameters')
  }

  // Export logic here
  console.log('Exporting to EHR:', { sessionId, format, destination, userId })
  return {
    exportId: crypto.randomUUID(),
    status: 'completed',
    location: `ehr://documents/${crypto.randomUUID()}`
  }
}