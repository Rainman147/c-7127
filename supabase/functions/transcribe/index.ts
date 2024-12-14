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

    console.log('Received audio data, preparing request to Speech-to-Text API')

    // Convert base64 to audio content
    const audioContent = audioData

    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GOOGLE_API_KEY')}`,
      },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audioContent
        }
      })
    })

    if (!response.ok) {
      console.error('Speech-to-Text API error:', await response.text())
      throw new Error(`Speech-to-Text API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Transcription response:', data)

    // Extract the transcription from the response
    const transcription = data.results?.[0]?.alternatives?.[0]?.transcript || ''

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