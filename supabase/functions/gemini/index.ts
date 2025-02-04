import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ServiceContainer } from "./services/ServiceContainer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
};

serve(async (req) => {
  // Detailed request logging
  console.log('[Gemini] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    time: new Date().toISOString()
  });

  // Handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    console.log('[Gemini] Handling OPTIONS request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Only POST method is allowed');
    }

    // Clone request for logging
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    
    console.log('[Gemini] Raw request details:', {
      bodyLength: rawBody.length,
      bodyPreview: rawBody.substring(0, 100),
      contentType: req.headers.get('content-type'),
      time: new Date().toISOString()
    });

    if (!rawBody) {
      console.error('[Gemini] Empty request body received');
      throw new Error('Request body is empty');
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log('[Gemini] Successfully parsed request data:', {
        hasContent: !!requestData.content,
        contentLength: requestData.content?.length,
        action: requestData.action,
        timestamp: requestData.timestamp,
        time: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('[Gemini] JSON parsing error:', {
        error: parseError.message,
        rawBody,
        time: new Date().toISOString()
      });
      throw new Error('Invalid JSON payload');
    }

    // Initialize ServiceContainer
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    ServiceContainer.initialize(supabaseUrl, supabaseKey, openaiKey);
    const services = ServiceContainer.getInstance();
    const streamHandler = services.stream;
    const response = streamHandler.getResponse(corsHeaders);

    // Auth validation
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await services.supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    // Create test chat
    const chat = await services.chat.getOrCreateChat(
      user.id, 
      null, 
      requestData.content.substring(0, 50)
    );

    if (!chat?.id) {
      throw new Error('Failed to create chat');
    }

    // Initialize stream
    await streamHandler.writeMetadata({ 
      chatId: chat.id,
      status: 'created',
      timestamp: new Date().toISOString()
    });

    // Save user message
    const userMessage = await services.message.saveUserMessage(chat.id, requestData.content);
    console.log('[Gemini] User message saved:', {
      messageId: userMessage.id,
      timestamp: new Date().toISOString()
    });

    // Create assistant message
    const assistantMessage = await services.message.saveAssistantMessage(chat.id);
    console.log('[Gemini] Assistant message created:', {
      messageId: assistantMessage.id,
      timestamp: new Date().toISOString()
    });

    // Process with OpenAI
    const messages = [
      { role: 'user', content: requestData.content }
    ];

    await services.openai.streamCompletion(messages, async (chunk: string) => {
      await streamHandler.writeChunk(chunk);
    });

    console.log('[Gemini] Stream processing completed');
    await streamHandler.close();
    
    return response;

  } catch (error) {
    console.error('[Gemini] Function error:', {
      error,
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: false
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});