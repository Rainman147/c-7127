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
    
    // Parse request body and validate
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }
    
    if (!body?.audioData) {
      console.error('Missing audio data in request');
      throw new Error('No audio data provided');
    }

    console.log('Audio data length:', body.audioData.length);

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      console.error('Google API key not found in environment');
      throw new Error('Google API key not configured');
    }

    // Call Google Cloud Speech-to-Text API
    console.log('Calling Google Speech-to-Text API...');
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      const errorData = await response.text();
      console.error('Google API error response:', errorData);
      throw new Error(`Google API error: ${response.status} ${errorData}`);
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