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

    console.log('Received audio data, preparing WebSocket connection to Gemini API')

    // Create WebSocket connection to Gemini API
    const ws = new WebSocket('wss://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:bidiGenerateContent', {
      headers: {
        'x-goog-api-key': GOOGLE_API_KEY || '',
      }
    })

    return new Promise((resolve, reject) => {
      let transcription = ''

      ws.onopen = () => {
        console.log('WebSocket connection established')
        
        // Send configuration
        ws.send(JSON.stringify({
          config: {
            response_modalities: ["TEXT"],
          }
        }))

        // Send audio data
        ws.send(JSON.stringify({
          contents: [{
            parts: [{
              inline_data: {
                mime_type: "audio/x-raw",
                data: audioData
              }
            }]
          }],
          end_of_turn: true
        }))
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)
          console.log('Received response:', response)

          if (response.text) {
            transcription += response.text
          }

          // Check if this is the final message
          if (response.end_of_turn) {
            ws.close()
            resolve(new Response(
              JSON.stringify({ transcription }),
              { 
                headers: { 
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                }
              }
            ))
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
          ws.close()
          reject(error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      ws.onclose = () => {
        console.log('WebSocket connection closed')
      }

      // Set a timeout to prevent hanging
      setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket connection timed out'))
      }, 30000) // 30 second timeout
    })

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