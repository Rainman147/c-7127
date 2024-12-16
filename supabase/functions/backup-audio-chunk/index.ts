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
    const formData = await req.formData()
    const audioChunk = formData.get('chunk') as File
    const sessionId = formData.get('sessionId')?.toString()
    const chunkNumber = parseInt(formData.get('chunkNumber')?.toString() || '0')
    const totalChunks = parseInt(formData.get('totalChunks')?.toString() || '1')
    const userId = formData.get('userId')?.toString()

    console.log('Received backup request:', {
      hasAudioChunk: !!audioChunk,
      sessionId,
      chunkNumber,
      totalChunks,
      userId,
    })

    // Validate session ID first
    if (!sessionId || sessionId.trim() === '') {
      console.error('Missing or empty session ID')
      return new Response(
        JSON.stringify({ 
          error: 'Missing session ID',
          details: 'A valid session ID is required'
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate other required fields
    if (!audioChunk) {
      throw new Error('Missing audio chunk')
    }
    if (!userId) {
      throw new Error('Missing user ID')
    }

    console.log(`Processing chunk ${chunkNumber} of ${totalChunks} for session ${sessionId}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload chunk to storage
    const chunkPath = `chunks/${sessionId}/${chunkNumber}.webm`
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('audio_files')
      .upload(chunkPath, audioChunk, {
        contentType: 'audio/webm',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Successfully uploaded chunk to storage:', chunkPath)

    // Update audio chunks table
    const { error: dbError } = await supabase
      .from('audio_chunks')
      .insert({
        user_id: userId,
        original_filename: `recording_${sessionId}_chunk${chunkNumber}`,
        chunk_number: chunkNumber,
        total_chunks: totalChunks,
        storage_path: chunkPath,
        status: 'stored'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    console.log('Successfully updated database record for chunk')

    return new Response(
      JSON.stringify({ 
        success: true,
        chunkNumber,
        sessionId,
        totalChunks,
        path: chunkPath
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
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    )
  }
})