import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData, streaming } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    console.log('Received audio data, preparing request to Gemini API')

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:streamGenerateContent?key=' + GOOGLE_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "audio/x-raw",
              data: audioData
            }
          }]
        }],
        tools: [{
          functionDeclarations: [{
            name: "transcribe",
            description: "Transcribes the given audio",
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
        }],
        generation_config: {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
        },
        stream: streaming || false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    if (streaming) {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let transcription = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(5))
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              transcription += ' ' + data.candidates[0].content.parts[0].text
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          transcription: transcription.trim(),
          status: 'success'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } else {
      const result = await response.json()
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
    }
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