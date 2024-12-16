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

    const formData = await req.formData()
    const sessionId = formData.get('sessionId')?.toString()
    const chunkNumber = parseInt(formData.get('chunkNumber')?.toString() || '0')
    const chunk = formData.get('chunk') as File

    if (!sessionId || !chunk) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing chunk ${chunkNumber} for session ${sessionId} and user ${user.id}`)

    // Create a consistent storage path
    const storagePath = `chunks/${user.id}/${sessionId}/${chunkNumber}.webm`
    console.log('Uploading to storage path:', storagePath)

    // Upload chunk to storage
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(storagePath, chunk, {
        contentType: 'audio/webm',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Save chunk metadata
    const { error: insertError } = await supabase
      .from('audio_chunks')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        chunk_number: chunkNumber,
        total_chunks: -1, // Will be updated when recording ends
        status: 'stored',
        original_filename: `chunk_${chunkNumber}.webm`
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
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