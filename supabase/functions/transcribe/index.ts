import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData } = await req.json()
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:streamGenerateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GOOGLE_API_KEY') || '',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            audio_data: {
              data: audioData
            }
          }]
        }],
        generation_config: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
        safety_settings: [{
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Transcription response:', data)

    return new Response(
      JSON.stringify({
        transcription: data.candidates[0]?.content?.parts[0]?.text || '',
      }),
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