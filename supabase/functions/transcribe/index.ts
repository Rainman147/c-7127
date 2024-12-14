import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { audioData, mimeType = 'audio/webm' } = await req.json()
    
    if (!audioData) {
      console.error('No audio data provided')
      throw new Error('No audio data provided')
    }

    console.log('Received audio data, length:', audioData.length, 'mimeType:', mimeType)

    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
    
    // Create form data for OpenAI API
    const formData = new FormData()
    
    // Ensure proper file extension based on mime type
    let filename = 'audio'
    switch (mimeType) {
      case 'audio/webm':
        filename += '.webm'
        break
      case 'audio/mp3':
      case 'audio/mpeg':
        filename += '.mp3'
        break
      case 'audio/wav':
        filename += '.wav'
        break
      case 'audio/ogg':
        filename += '.ogg'
        break
      default:
        filename += '.webm' // Default to webm if unknown
    }

    // Create blob with proper mime type
    const blob = new Blob([binaryData], { type: mimeType })
    formData.append('file', blob, filename)
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')

    console.log('Sending request to Whisper API with file:', filename)

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