import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received transcription request');
    const body = await req.json();
    
    if (!body || !body.audioData) {
      throw new Error('No audio data provided');
    }

    // Convert base64 to buffer
    const binaryData = Uint8Array.from(atob(body.audioData), c => c.charCodeAt(0));

    // Call Google Cloud Speech-to-Text API
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GOOGLE_API_KEY')}`,
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          model: 'default',
        },
        audio: {
          content: body.audioData,
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