import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "./utils/cors.ts"
import { logError } from "./utils/logging.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio')
    
    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error('No audio file provided')
    }

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    )

    console.log('Processing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    })

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GOOGLE_API_KEY')}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Please transcribe this audio recording accurately, focusing on medical terminology and symptoms if present.",
          }, {
            inline_data: {
              mime_type: audioFile.type,
              data: base64Audio
            }
          }]
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', response.status, error)
      throw new Error(`Gemini API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    console.log('Transcription completed successfully')

    return new Response(
      JSON.stringify({ transcription: data.candidates[0].content.parts[0].text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    logError('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})