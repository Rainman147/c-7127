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
    const totalChunks = formData.get('totalChunks') as string

    if (!chunk || !totalChunks) {
      throw new Error('Missing required fields')
    }

    console.log('Processing chunk with total chunks:', totalChunks)

    // Get current chunk number
    const { data: existingChunks, error: countError } = await supabase
      .from('audio_chunks')
      .select('chunk_number')
      .eq('user_id', user.id)
      .order('chunk_number', { ascending: false })
      .limit(1)

    if (countError) {
      throw countError
    }

    const chunkNumber = existingChunks && existingChunks.length > 0 
      ? existingChunks[0].chunk_number + 1 
      : 0

    const storagePath = `chunks/${user.id}/${chunkNumber}.webm`

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from('audio_files')
      .list(`chunks/${user.id}`)

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

    // Save chunk metadata
    const { error: insertError } = await supabase
      .from('audio_chunks')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        chunk_number: chunkNumber,
        total_chunks: parseInt(totalChunks),
        status: 'stored',
        original_filename: `chunk_${chunkNumber}.webm`
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to save chunk metadata')
    }

    console.log('Successfully processed chunk:', {
      userId: user.id,
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