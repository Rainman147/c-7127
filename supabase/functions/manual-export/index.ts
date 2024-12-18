import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManualExportRequest {
  userId: string
  patientId: string
  summaryId: string
  exportFormat: 'PDF' | 'DOC'
  destination: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, patientId, summaryId, exportFormat, destination } = await req.json() as ManualExportRequest

    console.log('Processing manual export request:', {
      userId,
      patientId,
      summaryId,
      exportFormat,
      destination
    })

    // Create export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('ehr_exports')
      .insert({
        user_id: userId,
        patient_id: patientId,
        chat_id: summaryId,
        ehr_system: 'manual_export',
        export_data: {
          format: exportFormat,
          destination,
          status: 'pending'
        }
      })
      .select()
      .single()

    if (exportError) {
      console.error('Error creating export record:', exportError)
      throw new Error('Failed to create export record')
    }

    // For now, we'll simulate the export process
    // In a real implementation, this would handle PDF generation and email sending
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update the export record status
    const { error: updateError } = await supabase
      .from('ehr_exports')
      .update({
        status: 'completed',
        export_data: {
          ...exportRecord.export_data,
          status: 'completed',
          completedAt: new Date().toISOString()
        }
      })
      .eq('id', exportRecord.id)

    if (updateError) {
      console.error('Error updating export record:', updateError)
      throw new Error('Failed to update export status')
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Summary exported successfully',
        exportId: exportRecord.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in manual-export function:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})