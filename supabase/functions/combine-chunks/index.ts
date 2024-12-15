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
    const { sessionId } = await req.json()
    
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    console.log(`Combining chunks for session ${sessionId}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('file_upload_sessions')
      .select()
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    // Download and combine all chunks
    const chunks: Uint8Array[] = []
    for (let i = 0; i < session.total_chunks; i++) {
      const { data, error } = await supabase.storage
        .from('audio_files')
        .download(`chunks/${sessionId}/${i}`)

      if (error) {
        throw error
      }

      const arrayBuffer = await data.arrayBuffer()
      chunks.push(new Uint8Array(arrayBuffer))
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of chunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }

    // Upload combined file
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(
        `${sessionId}/${session.original_filename}`,
        combinedArray,
        {
          contentType: session.content_type,
          upsert: true
        }
      )

    if (uploadError) {
      throw uploadError
    }

    // Clean up chunks
    for (let i = 0; i < session.total_chunks; i++) {
      await supabase.storage
        .from('audio_files')
        .remove([`chunks/${sessionId}/${i}`])
    }

    return new Response(
      JSON.stringify({
        success: true,
        blob: combinedArray
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error combining chunks:', error)
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