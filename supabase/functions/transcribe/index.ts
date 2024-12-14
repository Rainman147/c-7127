import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ALLOWED_ORIGIN = 'https://a3499179-1ed8-4343-8cbe-3b734179bef0.lovableproject.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com",
}

interface TranscriptionError extends Error {
  status?: number;
  retryable?: boolean;
}

// PHI patterns for server-side de-identification
const PHI_PATTERNS = [
  // Names
  /\b(?:[A-Z][a-z]+ ){1,2}[A-Z][a-z]+\b/g,
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  // SSN
  /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Dates
  /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
  // Medical record numbers
  /\b(?:MRN|Medical Record Number)[:# ]?\d+\b/gi,
];

const deidentifyText = (text: string): string => {
  let deidentifiedText = text;
  PHI_PATTERNS.forEach((pattern, index) => {
    deidentifiedText = deidentifiedText.replace(pattern, `[REDACTED-${index}]`);
  });
  return deidentifiedText;
};

const secureLog = (event: string, data: any, excludeKeys: string[] = ['audioData', 'transcription']) => {
  const sanitizedData = { ...data };
  excludeKeys.forEach(key => {
    if (key in sanitizedData) {
      sanitizedData[key] = '[REDACTED]';
    }
  });
  
  console.log(`[${new Date().toISOString()}] ${event}:`, sanitizedData);
};

serve(async (req) => {
  // Log incoming request (excluding sensitive data)
  secureLog('Incoming request', {
    method: req.method,
    url: req.url,
    origin: req.headers.get('origin'),
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // Enforce TLS
  if (!req.url.startsWith('https')) {
    return new Response('HTTPS required', { status: 403, headers: corsHeaders });
  }

  try {
    const { audioData, streaming } = await req.json();
    
    if (!audioData) {
      throw new Error('No audio data provided');
    }

    secureLog('Received transcription request', { streaming });

    // Validate audio data format
    try {
      atob(audioData);
    } catch {
      throw new Error('Invalid audio data format. Must be base64 encoded.');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:streamGenerateContent?key=' + Deno.env.get('GOOGLE_API_KEY'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "audio/x-raw",
              data: audioData
            }
          }]
        }],
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
        }],
        generation_config: {
          temperature: 0,
          topP: 1,
          topK: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    const result = await response.json();
    
    // De-identify transcription before returning
    if (result.transcription) {
      result.transcription = deidentifyText(result.transcription);
    }

    secureLog('Transcription completed', { status: 'success' });

    return new Response(
      JSON.stringify({ 
        transcription: result.transcription || '',
        status: 'success'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    secureLog('Transcription error', { error: error.message });
    
    const errorResponse = {
      error: error.message || 'An unexpected error occurred',
      status: 'error',
      retryable: (error as TranscriptionError).retryable ?? true
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: (error as TranscriptionError).status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});