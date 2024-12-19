import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetPatientDataParams {
  patientId: string;
}

interface GetDoctorDataParams {
  doctorId?: string;
}

serve(async (req) => {
  console.log('Template data function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid token')
    }

    const { action, ...params } = await req.json()
    console.log('Action:', action, 'Params:', params)

    let result
    switch (action) {
      case 'getPatientData': {
        const { patientId } = params as GetPatientDataParams
        console.log('Getting patient data for ID:', patientId)

        const { data: patient, error: patientError } = await supabaseClient
          .from('patients')
          .select(`
            id,
            name,
            dob,
            address,
            contact_info,
            medical_history,
            current_medications,
            recent_tests
          `)
          .eq('id', patientId)
          .eq('user_id', user.id)
          .single()

        if (patientError) throw patientError
        if (!patient) throw new Error('Patient not found')

        result = { 
          patient,
          timestamp: {
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            iso: new Date().toISOString()
          }
        }
        break
      }

      case 'getDoctorData': {
        const { doctorId } = params as GetDoctorDataParams
        console.log('Getting doctor data for user:', user.id)

        const { data: doctor, error: doctorError } = await supabaseClient
          .from('doctors')
          .select(`
            id,
            title,
            full_name,
            specialty,
            clinic_name,
            address,
            phone,
            email,
            license_number,
            business_hours
          `)
          .eq('user_id', doctorId || user.id)
          .single()

        if (doctorError) throw doctorError
        if (!doctor) throw new Error('Doctor profile not found')

        result = { 
          doctor,
          timestamp: {
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            iso: new Date().toISOString()
          }
        }
        break
      }

      case 'getAllTemplateData': {
        const { patientId } = params as GetPatientDataParams
        console.log('Getting all template data for patient:', patientId)

        const [patientResponse, doctorResponse] = await Promise.all([
          supabaseClient
            .from('patients')
            .select(`
              id,
              name,
              dob,
              address,
              contact_info,
              medical_history,
              current_medications,
              recent_tests
            `)
            .eq('id', patientId)
            .eq('user_id', user.id)
            .single(),

          supabaseClient
            .from('doctors')
            .select(`
              id,
              title,
              full_name,
              specialty,
              clinic_name,
              address,
              phone,
              email,
              license_number,
              business_hours
            `)
            .eq('user_id', user.id)
            .single()
        ])

        if (patientResponse.error) throw patientResponse.error
        if (doctorResponse.error) throw doctorResponse.error
        if (!patientResponse.data) throw new Error('Patient not found')
        if (!doctorResponse.data) throw new Error('Doctor profile not found')

        result = {
          patient: patientResponse.data,
          doctor: doctorResponse.data,
          timestamp: {
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            iso: new Date().toISOString()
          }
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )

  } catch (error) {
    console.error('Error in template-data function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})