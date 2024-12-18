import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[TTS-Edge] Handling CORS preflight request');
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    if (!openAIApiKey) {
      console.error('[TTS-Edge] OpenAI API key not configured');
      throw new Error('OpenAI API key is not configured');
    }

    if (req.method !== 'POST') {
      console.error('[TTS-Edge] Invalid method:', req.method);
      throw new Error('Method not allowed');
    }

    const requestBody = await req.json();
    const { text } = requestBody;
    
    console.log('[TTS-Edge] Processing text:', text?.substring(0, 50) + '...');
    console.log('[TTS-Edge] Text length:', text?.length || 0);

    if (!text) {
      console.error('[TTS-Edge] No text provided in request');
      throw new Error('Text is required');
    }

    // Validate text length
    if (text.length > 4096) {
      console.error('[TTS-Edge] Text length exceeds limit:', text.length);
      throw new Error('Text length exceeds maximum limit of 4096 characters');
    }

    console.log('[TTS-Edge] Sending request to OpenAI TTS API');
    const startTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        response_format: 'mp3',
      }),
    });

    const processingTime = Date.now() - startTime;
    console.log('[TTS-Edge] OpenAI API response time:', processingTime, 'ms');

    if (!response.ok) {
      const error = await response.json();
      console.error('[TTS-Edge] OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Failed to generate speech'}`);
    }

    console.log('[TTS-Edge] Received audio response from OpenAI');
    const audioData = await response.arrayBuffer();
    
    // Convert to base64 in smaller chunks to prevent stack overflow
    const chunkSize = 16384; // Process 16KB at a time (reduced from 32KB)
    const uint8Array = new Uint8Array(audioData);
    let base64Audio = '';
    
    console.log('[TTS-Edge] Starting base64 conversion of audio data:', uint8Array.length, 'bytes');
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
      
      if (i % (chunkSize * 4) === 0) {
        console.log('[TTS-Edge] Converted', i, 'of', uint8Array.length, 'bytes to base64');
      }
    }
    
    console.log('[TTS-Edge] Successfully converted audio to base64, size:', base64Audio.length);

    return new Response(
      JSON.stringify({ audio: base64Audio }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[TTS-Edge] Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});