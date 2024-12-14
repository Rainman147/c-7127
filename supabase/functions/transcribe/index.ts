import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const SUPPORTED_FORMATS = [
  'audio/wav',
  'audio/mp3',
  'audio/aiff',
  'audio/aac',
  'audio/ogg',
  'audio/flac'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData, mimeType = 'audio/wav' } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    if (!SUPPORTED_FORMATS.includes(mimeType)) {
      throw new Error(`Unsupported audio format. Supported formats are: ${SUPPORTED_FORMATS.join(', ')}`)
    }

    console.log('Received audio data, preparing WebSocket connection to Gemini API')
    console.log(`Audio format: ${mimeType}`)

    // Create WebSocket connection to Gemini API
    const ws = new WebSocket('wss://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:streamGenerateContent', {
      headers: {
        'x-goog-api-key': GOOGLE_API_KEY || '',
      }
    })

    return new Promise((resolve, reject) => {
      let transcription = ''

      ws.onopen = () => {
        console.log('WebSocket connection established')
        
        // Send initial configuration for text-only responses
        ws.send(JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: "Generate a transcript of the following audio."
            }, {
              inline_data: {
                mime_type: mimeType,
                data: audioData
              }
            }]
          }],
          generation_config: {
            temperature: 0,
            candidate_count: 1,
            top_p: 1,
            top_k: 1,
            max_output_tokens: 2048,
          },
          tools: [{
            function_declarations: [{
              name: "transcribe_audio",
              description: "Transcribes audio data to text",
              parameters: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "The transcribed text from the audio"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score of the transcription"
                  }
                },
                required: ["text"]
              }
            }]
          }]
        }))
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)
          console.log('Received response:', response)

          // Extract text from the response
          if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
            transcription += response.candidates[0].content.parts[0].text
          }

          // Check if this is the final message
          if (response.candidates?.[0]?.finishReason === 'STOP') {
            ws.close()
            resolve(new Response(
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