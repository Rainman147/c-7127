import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/webm'
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing transcription request...');
    
    // Get the Google API key from environment variables
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
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

      // Validate file size
      if (audioFile.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      // Validate mime type
      if (!ALLOWED_MIME_TYPES.includes(audioFile.type)) {
        throw new Error(`Invalid file type. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`);
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
    
    // Call Gemini API for transcription
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOOGLE_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Please transcribe this audio recording accurately."
          }, {
            inline_data: {
              mime_type: "audio/webm",
              data: audioData
            }
          }]
        }],
        generationConfig: {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', response.status, error);
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json();
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