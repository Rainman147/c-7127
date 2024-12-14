import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

interface TranscriptionError extends Error {
  status?: number;
  retryable?: boolean;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiAPI(audioData: string, retryCount = 0): Promise<Response> {
  try {
    console.log(`Attempting Gemini API call (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    
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
        }
      })
    });

    if (!response.ok) {
      const error = new Error(`Gemini API error: ${response.status}`) as TranscriptionError;
      error.status = response.status;
      error.retryable = response.status >= 500 || response.status === 429;
      throw error;
    }

    return response;
  } catch (error) {
    console.error(`API call failed (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < MAX_RETRIES - 1 && (error as TranscriptionError).retryable !== false) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await delay(RETRY_DELAY);
      return callGeminiAPI(audioData, retryCount + 1);
    }
    
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioData, streaming } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    // Validate audio data format
    try {
      atob(audioData); // Verify it's valid base64
    } catch {
      throw new Error('Invalid audio data format. Must be base64 encoded.');
    }

    console.log('Received audio data, preparing request to Gemini API');

    const response = await callGeminiAPI(audioData);
    const result = await response.json();

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
    );
  } catch (error) {
    console.error('Transcription error:', error);
    
    const errorResponse = {
      error: error.message || 'An unexpected error occurred',
      status: 'error',
      retryable: (error as TranscriptionError).retryable ?? true
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: (error as TranscriptionError).status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})