import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from './utils/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received transcription request');
    const { audioData, metadata } = await req.json();

    if (!audioData) {
      throw new Error('No audio data provided');
    }

    // Convert base64 to buffer
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

    // Call Google Cloud Speech-to-Text API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GOOGLE_API_KEY') || '',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default',
        },
        audio: {
          content: audioData,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google API error:', error);
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Transcription successful');

    return new Response(JSON.stringify({ 
      transcription: data.results?.[0]?.alternatives?.[0]?.transcript || '',
      status: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});