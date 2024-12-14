import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing transcription request...');
    
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    let audioData: string;
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data
      const formData = await req.formData();
      const audioFile = formData.get('audio');
      
      if (!audioFile || !(audioFile instanceof File)) {
        throw new Error('No audio file provided in form data');
      }

      // Convert file to base64
      const arrayBuffer = await audioFile.arrayBuffer();
      audioData = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );
      
      console.log('Successfully processed form data audio file');
    } else {
      // Handle JSON payload
      const body = await req.json();
      if (!body.audioData) {
        throw new Error('No audio data provided in JSON');
      }
      audioData = body.audioData;
      console.log('Successfully processed JSON audio data');
    }

    console.log('Sending request to Gemini API...');
    
    // Using the correct Gemini API endpoint for audio transcription
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              inlineData: {
                mimeType: "audio/webm",
                data: audioData
              }
            }]
          }],
          generationConfig: {
            temperature: 0,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
          },
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
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', response.status, error);
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);
    
    const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!transcription) {
      throw new Error('No transcription received from Gemini API');
    }

    console.log('Transcription completed successfully');

    return new Response(
      JSON.stringify({ transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
})