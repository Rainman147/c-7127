import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    console.log('Received audio data, preparing request to Gemini API')

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GOOGLE_API_KEY') || '',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            inline_data: {
              mime_type: "audio/x-raw",
              data: audioData
            }
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topP: 1,
          topK: 32,
          maxOutputTokens: 4096,
        },
        tools: [{
          functionDeclarations: [{
            name: "transcribe_audio",
            description: "Transcribes the given audio data into text",
            parameters: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "The transcribed text from the audio"
                }
              },
              required: ["text"]
            }
          }]
        }]
      })
    })

    if (!response.ok) {
      console.error('Gemini API error:', await response.text())
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Transcription response:', data)

    // Extract the transcription from Gemini's response
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return new Response(
      JSON.stringify({ transcription }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})