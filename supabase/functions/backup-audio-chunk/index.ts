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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      throw new Error('Failed to get user ID')
    }

    console.log('Processing request for user:', user.id)

    const formData = await req.formData()
    const chunk = formData.get('chunk') as Blob
    const sessionId = formData.get('sessionId')?.toString()
    const chunkNumber = formData.get('chunkNumber')?.toString()

    if (!chunk || !sessionId || !chunkNumber) {
      throw new Error('Missing required fields')
    }

    console.log('Processing chunk:', {
      sessionId,
      chunkNumber,
      size: chunk.size,
      type: chunk.type
    })

    // Create storage path with user ID and session ID
    const storagePath = `chunks/${user.id}/${sessionId}/${chunkNumber}.webm`

    // Upload chunk to storage
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(storagePath, chunk, {
        contentType: 'audio/webm',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload audio chunk')
    }

    // Save chunk metadata
    const { error: insertError } = await supabase
      .from('audio_chunks')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        chunk_number: parseInt(chunkNumber),
        total_chunks: -1, // Will be updated when recording ends
        status: 'stored',
        original_filename: `chunk_${chunkNumber}.webm`
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to save chunk metadata')
    }

    console.log('Successfully processed chunk:', {
      userId: user.id,
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