import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const chunk = formData.get('chunk') as Blob
    const sessionId = formData.get('sessionId') as string
    const totalChunks = formData.get('totalChunks') as string || '1'

    if (!sessionId) {
      throw new Error('Missing session ID')
    }

    if (!chunk) {
      throw new Error('No audio chunk provided')
    }

    console.log('Processing chunk for session:', sessionId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current chunk number
    const { data: existingChunks, error: countError } = await supabase
      .from('audio_chunks')
      .select('chunk_number')
      .eq('storage_path', `chunks/${sessionId}/%`)
      .order('chunk_number', { ascending: false })
      .limit(1)

    if (countError) {
      throw countError
    }

    const chunkNumber = existingChunks && existingChunks.length > 0 
      ? existingChunks[0].chunk_number + 1 
      : 0

    const storagePath = `chunks/${sessionId}/${chunkNumber}.webm`

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from('audio_files')
      .list(`chunks/${sessionId}`)

    const fileExists = existingFile?.some(file => file.name === `${chunkNumber}.webm`)
    if (fileExists) {
      console.log('Chunk already exists, skipping upload:', storagePath)
      return new Response(
        JSON.stringify({ 
          message: 'Chunk already processed',
          chunkNumber 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload chunk to storage
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(storagePath, chunk, {
        contentType: 'audio/webm',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload audio chunk')
    }

    // Get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Failed to get user ID')
    }

    // Save chunk metadata
    const { error: insertError } = await supabase
      .from('audio_chunks')
      .insert({
        storage_path: storagePath,
        chunk_number: chunkNumber,
        total_chunks: parseInt(totalChunks),
        status: 'stored',
        user_id: user.id,
        original_filename: `chunk_${chunkNumber}.webm`
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to save chunk metadata')
    }

    console.log('Successfully processed chunk:', {
      sessionId,
      chunkNumber,
      storagePath
    })

    return new Response(
      JSON.stringify({ 
        message: 'Chunk processed successfully',
        chunkNumber,
        storagePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing chunk:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process audio chunk'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})