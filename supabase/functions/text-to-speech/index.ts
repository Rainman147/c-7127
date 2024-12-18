import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const MAX_TEXT_LENGTH = 4096;
const API_TIMEOUT = 30000; // 30 seconds timeout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Utility function to measure execution time
const measureTime = (startTime: number): string => {
  return `${(Date.now() - startTime).toFixed(2)}ms`;
};

// Function to handle OpenAI TTS API request with timeout
async function fetchWithTimeout(text: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

serve(async (req) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Request started`);

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
    
    if (!text) {
      console.error('[TTS-Edge] No text provided in request');
      throw new Error('Text is required');
    }

    // Truncate text to maximum length
    const truncatedText = text.slice(0, MAX_TEXT_LENGTH);
    if (text.length > MAX_TEXT_LENGTH) {
      console.warn(`[TTS-Edge] Text truncated from ${text.length} to ${MAX_TEXT_LENGTH} characters`);
    }

    console.log(`[TTS-Edge] Processing text (${truncatedText.length} chars) at ${measureTime(startTime)}`);

    // Make API request with timeout
    const response = await fetchWithTimeout(truncatedText, API_TIMEOUT);
    console.log(`[TTS-Edge] Received OpenAI response at ${measureTime(startTime)}`);

    // Get audio data as array buffer
    const audioData = await response.arrayBuffer();
    console.log(`[TTS-Edge] Audio data processed (${audioData.byteLength} bytes) at ${measureTime(startTime)}`);

    // Return the audio data with appropriate headers
    return new Response(audioData, { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'audio/mp3',
        'Content-Length': audioData.byteLength.toString(),
      },
    });

  } catch (error: any) {
    console.error(`[TTS-Edge] Error at ${measureTime(startTime)}:`, error);
    
    // Handle specific error types
    let status = 500;
    let message = 'Internal server error';

    if (error.name === 'AbortError') {
      status = 504;
      message = 'Request timeout - OpenAI API took too long to respond';
    } else if (error.message.includes('API key')) {
      status = 503;
      message = 'Service configuration error';
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error.message 
      }),
      { 
        status,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});