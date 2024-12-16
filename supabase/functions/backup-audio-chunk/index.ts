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
    const audioChunk = formData.get('chunk') as File
    const sessionId = formData.get('sessionId')?.toString()
    const chunkNumber = parseInt(formData.get('chunkNumber')?.toString() || '0')
    const userId = formData.get('userId')?.toString()

    if (!audioChunk || !sessionId || !userId) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing chunk ${chunkNumber} for session ${sessionId}`)

    // Upload chunk to storage
    const chunkPath = `chunks/${sessionId}/${chunkNumber}.webm`
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(chunkPath, audioChunk, {
        contentType: 'audio/webm',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Update audio chunks table
    const { error: dbError } = await supabase
      .from('audio_chunks')
      .insert({
        user_id: userId,
        original_filename: `recording_${sessionId}_chunk${chunkNumber}`,
        chunk_number: chunkNumber,
        storage_path: chunkPath,
        status: 'stored'
      })

    if (dbError) {
      throw dbError
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
      JSON.stringify({ error: error.message }),
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