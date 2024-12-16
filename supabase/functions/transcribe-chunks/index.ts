import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const { sessionId, userId } = await req.json()

    if (!sessionId || !userId) {
      throw new Error('Missing required parameters')
    }

    console.log('Processing chunks for session:', sessionId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all chunks for the session
    const { data: chunks, error: chunksError } = await supabase
      .from('audio_chunks')
      .select('*')
      .eq('storage_path', 'like', `%${sessionId}%`)
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
    const audioChunks: Blob[] = []
    for (const chunk of chunks) {
      const { data, error: downloadError } = await supabase.storage
        .from('audio_files')
        .download(chunk.storage_path)

      if (downloadError) {
        console.error('Error downloading chunk:', downloadError)
        continue
      }

      audioChunks.push(data)
    }

    if (audioChunks.length === 0) {
      throw new Error('Failed to download any chunks')
    }

    // Combine chunks into a single blob
    const combinedAudio = new Blob(audioChunks, { type: 'audio/webm' })
    
    // Convert to base64
    const buffer = await combinedAudio.arrayBuffer()
    const base64Audio = btoa(
      new Uint8Array(buffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    // Send to Whisper API for transcription
    const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('transcribe', {
      body: { 
        audioData: base64Audio,
        mimeType: 'audio/webm',
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
        transcription: transcriptionData.transcription,
        message: 'Chunks processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})