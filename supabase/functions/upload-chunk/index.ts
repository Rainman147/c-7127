import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const sessionId = formData.get('sessionId')?.toString()
    const chunkNumber = parseInt(formData.get('chunkNumber')?.toString() || '0')
    const chunk = formData.get('chunk') as File

    if (!sessionId || !chunk) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing chunk ${chunkNumber} for session ${sessionId}`)

    // Upload chunk to storage
    const chunkPath = `chunks/${sessionId}/${chunkNumber}`
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(chunkPath, chunk, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Update session progress
    const { data: session, error: sessionError } = await supabase
      .from('file_upload_sessions')
      .update({
        chunks_uploaded: chunkNumber + 1,
        status: 'uploading'
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (sessionError) {
      throw sessionError
    }

    // Check if all chunks are uploaded
    if (session && session.chunks_uploaded === session.total_chunks) {
      console.log(`All chunks uploaded for session ${sessionId}`)
      
      const { error: updateError } = await supabase
        .from('file_upload_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (updateError) {
        throw updateError
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunkNumber,
        sessionId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error processing chunk:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})