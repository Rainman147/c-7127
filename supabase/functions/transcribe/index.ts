import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting transcription request');
  console.log('OpenAI API Key present:', !!openAIApiKey);

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error('No audio file provided');
    }

    console.log('Received audio file:', audioFile.name, 'Type:', audioFile.type, 'Size:', audioFile.size);

    // Extract file extension and validate format
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase();
    const mimeType = audioFile.type.split('/')[1]?.toLowerCase();

    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      console.error('Invalid file extension:', fileExtension);
      throw new Error(`Invalid file format. Supported formats: ${JSON.stringify(SUPPORTED_FORMATS)}`);
    }

    // Prepare form data for OpenAI API
    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', 'en');

    console.log('Sending request to OpenAI Whisper API...');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', error);
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const result = await response.json();
    console.log('Transcription successful');

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});