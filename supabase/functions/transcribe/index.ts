import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "./utils/cors.ts"
import { logError } from "./utils/logging.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
    } else {
      // Handle JSON payload
      const body = await req.json();
      if (!body.audioData) {
        throw new Error('No audio data provided in JSON');
      }
      audioData = body.audioData;
    }

    console.log('Processing audio data of length:', audioData.length);

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    // Using the Speech-to-Text API endpoint
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOOGLE_API_KEY}`
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          model: 'default',
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audioData
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Speech-to-Text API error:', response.status, error);
      throw new Error(`Google Speech-to-Text API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('Transcription completed successfully');

    // Extract transcription from the response
    const transcription = data.results?.[0]?.alternatives?.[0]?.transcript || '';

    return new Response(
      JSON.stringify({ transcription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logError('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})