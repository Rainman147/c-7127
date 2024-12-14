import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from './utils/cors.ts';
import { validateAudioPayload } from './utils/validation.ts';
import { transcribeWithGemini } from './services/gemini.ts';
import { secureLog, logError } from './utils/logging.ts';

serve(async (req) => {
  // Log incoming request (excluding sensitive data)
  secureLog('Incoming request', {
    method: req.method,
    url: req.url,
    origin: req.headers.get('origin'),
  });

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const requestData = await req.json();
    secureLog('Request received', { 
      hasAudioData: !!requestData.audioData,
      hasMetadata: !!requestData.metadata 
    });

    // Validate payload
    const payload = validateAudioPayload(requestData);
    
    // Process transcription
    const result = await transcribeWithGemini(payload);

    secureLog('Transcription successful', { 
      hasResult: !!result,
      resultType: typeof result 
    });

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
    logError(error as Error, { 
      stage: 'edge_function_processing'
    });

    const errorResponse = {
      error: error.message || 'An unexpected error occurred',
      status: 'error',
      retryable: (error as any).status >= 500 || (error as any).status === 429
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: (error as any).status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});