import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/flac',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm'
];

const MIME_TO_EXTENSION = {
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/flac': 'flac',
  'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm'
};

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

    // Validate MIME type
    if (!metadata?.mimeType || !SUPPORTED_MIME_TYPES.includes(metadata.mimeType)) {
      console.error(`Unsupported MIME type: ${metadata?.mimeType}`)
      throw new Error(`Unsupported audio format. Supported formats: ${SUPPORTED_MIME_TYPES.join(', ')}`)
    }

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
    
    // Create form data for OpenAI API
    const formData = new FormData()
    
    // Use the correct extension based on MIME type
    const extension = MIME_TO_EXTENSION[metadata.mimeType]
    const filename = `audio.${extension}`
    
    console.log(`Creating ${filename} for Whisper API with MIME type ${metadata.mimeType}`)

    // Create blob with the correct MIME type
    const blob = new Blob([binaryData], { type: metadata.mimeType })
    
    console.log('Created blob:', {
      size: blob.size,
      type: blob.type,
      filename
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