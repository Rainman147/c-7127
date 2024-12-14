import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
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
    const { audioData, metadata } = await req.json()
    
    if (!audioData) {
      console.error('No audio data provided')
      throw new Error('No audio data provided')
    }

    console.log('Received audio data:', {
      dataLength: audioData.length,
      mimeType: metadata?.mimeType,
      streaming: metadata?.streaming
    })

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
    
    // Create form data for OpenAI API
    const formData = new FormData()
    
    // Always use webm format since that's what we're recording in
    const filename = 'audio.webm'
    
    console.log(`Creating ${filename} for Whisper API`)

    // Create blob with webm type which is supported by Whisper
    const blob = new Blob([binaryData], { type: 'audio/webm' })
    
    // Log blob details for debugging
    console.log('Created blob:', {
      size: blob.size,
      type: blob.type
    })

    formData.append('file', blob, filename)
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    console.log('Sending request to Whisper API')

    // Make request to Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper API error:', error)
      throw new Error(`Whisper API error: ${response.status} ${error}`)
    }

    const result = await response.json()
    console.log('Transcription completed successfully')

    return new Response(
      JSON.stringify({ transcription: result.text }),
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