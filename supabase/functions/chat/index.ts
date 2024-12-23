import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('[ChatFunction] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[ChatFunction] Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const startTime = performance.now();
    console.log('[ChatFunction] Starting request processing');

    // Check OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('[ChatFunction] OpenAI API key is missing');
      throw new Error('OpenAI API key is required');
    }
    console.log('[ChatFunction] OpenAI API key verified');

    // Parse request body
    const requestBody = await req.json();
    console.log('[ChatFunction] Request body received:', {
      messageCount: requestBody.messages?.length || 0,
      hasSystemInstructions: !!requestBody.systemInstructions
    });

    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      console.error('[ChatFunction] Invalid messages format:', requestBody);
      throw new Error('Messages must be provided as an array');
    }

    // Prepare messages array
    const messageArray = [];
    if (requestBody.systemInstructions) {
      messageArray.push({
        role: 'system',
        content: requestBody.systemInstructions
      });
      console.log('[ChatFunction] Added system instructions to message array');
    }

    // Add user messages
    messageArray.push(...requestBody.messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })));
    console.log('[ChatFunction] Prepared message array:', {
      totalMessages: messageArray.length,
      roles: messageArray.map((msg: any) => msg.role)
    });

    console.log('[ChatFunction] Initiating OpenAI API request');
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.error('[ChatFunction] Request timed out after 30s');
    }, 30000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messageArray,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      console.log('[ChatFunction] OpenAI API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[ChatFunction] OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          error: error.error?.message || 'Unknown error',
          type: error.error?.type
        });
        throw new Error(error.error?.message || 'Error calling OpenAI API');
      }

      const data = await response.json();
      console.log('[ChatFunction] Successfully processed OpenAI response:', {
        choicesCount: data.choices?.length,
        firstChoiceLength: data.choices?.[0]?.message?.content?.length
      });

      if (!data.choices?.[0]?.message?.content) {
        console.error('[ChatFunction] Invalid response format from OpenAI:', data);
        throw new Error('Invalid response format from OpenAI');
      }

      const content = data.choices[0].message.content;
      const duration = performance.now() - startTime;
      console.log('[ChatFunction] Request completed successfully:', {
        duration: `${duration.toFixed(2)}ms`,
        contentLength: content.length
      });

      return new Response(
        JSON.stringify({ content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      clearTimeout(timeout);
      throw fetchError;
    }
  } catch (error) {
    console.error('[ChatFunction] Error in chat function:', {
      error: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})