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
    const { sessionId, userId } = await req.json()
    
    if (!sessionId || !userId) {
      throw new Error('Session ID and User ID are required')
    }

    console.log('Processing chunks for session:', sessionId, 'and user:', userId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all chunks for this session
    const { data: chunks, error: chunksError } = await supabase
      .from('audio_chunks')
      .select('*')
      .eq('user_id', userId)
      .order('chunk_number', { ascending: true })

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError)
      throw chunksError
    }

    if (!chunks || chunks.length === 0) {
      console.error('No chunks found for session:', sessionId)
      throw new Error('No chunks found for session')
    }

    console.log(`Found ${chunks.length} chunks to process`)

    // Download and combine all chunks
    const audioChunks: Uint8Array[] = []
    
    for (const chunk of chunks) {
      console.log('Downloading chunk:', chunk.storage_path)
      
      const { data, error: downloadError } = await supabase.storage
        .from('audio_files')
        .download(chunk.storage_path)

      if (downloadError) {
        console.error('Error downloading chunk:', downloadError)
        throw downloadError
      }

      const arrayBuffer = await data.arrayBuffer()
      audioChunks.push(new Uint8Array(arrayBuffer))
    }

    // Combine chunks
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of audioChunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }

    // Send to Whisper API for transcription
    const { data: transcription, error: transcriptionError } = await supabase.functions.invoke('transcribe', {
      body: { 
        audioData: combinedArray,
        userId,
        sessionId
      }
    })

    if (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      throw transcriptionError
    }

    console.log('Transcription completed successfully')

    return new Response(
      JSON.stringify({
        transcription: transcription.text,
        metadata: transcription.metadata
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error processing chunks:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process audio chunks'
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