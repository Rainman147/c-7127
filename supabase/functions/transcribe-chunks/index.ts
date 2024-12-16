import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    console.log('Received request to transcribe chunks')
    
    // Parse request body
    const { sessionId, userId } = await req.json()
    
    if (!sessionId || !userId) {
      console.error('Missing required parameters:', { sessionId, userId })
      throw new Error('Session ID and User ID are required')
    }

    console.log('Processing chunks for session:', sessionId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all chunks for this session ordered by chunk number
    const { data: chunks, error: chunksError } = await supabase
      .from('audio_chunks')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('chunk_number', { ascending: true })

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError)
      throw new Error('Failed to fetch audio chunks')
    }

    if (!chunks || chunks.length === 0) {
      console.error('No chunks found for session:', sessionId)
      throw new Error('No audio chunks found')
    }

    console.log(`Found ${chunks.length} chunks to process`)

    // Combine audio chunks
    let totalLength = 0
    const audioChunks: Uint8Array[] = []
    
    for (const chunk of chunks) {
      console.log('Processing chunk:', {
        chunkNumber: chunk.chunk_number,
        storagePath: chunk.storage_path
      })
      
      const { data, error: downloadError } = await supabase.storage
        .from('audio_files')
        .download(chunk.storage_path)

      if (downloadError) {
        console.error('Error downloading chunk:', downloadError)
        throw new Error(`Failed to download chunk ${chunk.chunk_number}`)
      }

      const arrayBuffer = await data.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      audioChunks.push(uint8Array)
      totalLength += uint8Array.length
    }

    // Combine all chunks into a single Uint8Array
    const combinedArray = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      combinedArray.set(chunk, offset)
      offset += chunk.length
    }

    console.log('Combined audio size:', totalLength, 'bytes')

    // Send to Whisper API for transcription
    const { data: transcription, error: transcriptionError } = await supabase.functions.invoke('transcribe', {
      body: { 
        audioData: Array.from(combinedArray),
        userId,
        sessionId
      }
    })

    if (transcriptionError) {
      console.error('Transcription error:', transcriptionError)
      throw new Error('Failed to transcribe audio')
    }

    console.log('Transcription completed successfully')

    // Clean up chunks after successful transcription
    const { error: cleanupError } = await supabase
      .from('audio_chunks')
      .update({ status: 'processed' })
      .eq('session_id', sessionId)

    if (cleanupError) {
      console.error('Error cleaning up chunks:', cleanupError)
      // Don't throw here as transcription was successful
    }

    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcription.transcription
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing chunks:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process audio chunks',
        details: error.message
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})