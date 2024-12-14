import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to Gemini function for audio transcription');
    const { audioData, language = "en-US" } = await req.json();
    
    if (!audioData) {
      throw new Error('No audio data provided');
    }

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      console.error('Google API key not found');
      throw new Error('Google API key not configured');
    }

    console.log('Sending audio data to Gemini API');
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': googleApiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Transcribe this audio content: ${audioData}`
            }]
          }],
          generationConfig: {
            temperature: 0,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Received transcription from Gemini API');

    return new Response(
      JSON.stringify({ 
        transcription: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        status: 'success'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in gemini function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});