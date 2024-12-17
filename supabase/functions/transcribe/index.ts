import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData, mimeType, chunkNumber, totalChunks, sessionId } = await req.json()
    console.log('Processing audio chunk:', { chunkNumber, totalChunks, sessionId, mimeType })

    if (!audioData) {
      throw new Error('No audio data provided')
    }

    // Convert base64 to blob
    const binaryData = atob(audioData)
    const bytes = new Uint8Array(binaryData.length)
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: mimeType || 'audio/wav' })

    // Create form data for OpenAI API
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')
    formData.append('response_format', 'json')

    console.log('Sending chunk to Whisper API:', { size: audioBlob.size })

    // Send to Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper API error:', error)
      throw new Error(`Whisper API error: ${response.status} ${error}`)
    }

    const result = await response.json()
    console.log('Transcription completed for chunk:', { chunkNumber, text: result.text.substring(0, 50) + '...' })

    // Store transcription in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabase
      .from('audio_chunks')
      .update({ 
        transcription: result.text,
        status: 'processed'
      })
      .eq('session_id', sessionId)
      .eq('chunk_number', chunkNumber)

    if (updateError) {
      console.error('Error updating chunk status:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        transcription: result.text,
        chunkNumber,
        totalChunks 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})