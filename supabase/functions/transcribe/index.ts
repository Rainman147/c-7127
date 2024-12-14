import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

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

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:streamGenerateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY || '',
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: "Transcribe this audio accurately"
          }, {
            inline_data: {
              mime_type: "audio/wav",
              data: audioData
            }
          }]
        }],
        generation_config: {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
        },
        tools: [{
          functionDeclarations: [{
            name: "transcribe_audio",
            description: "Transcribes audio data to text",
            parameters: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "The transcribed text"
                }
              },
              required: ["text"]
            }
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('Transcription result:', result)

    return new Response(
      JSON.stringify({ 
        transcription: result.candidates?.[0]?.content?.parts?.[0]?.text || '',
        status: 'success'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
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