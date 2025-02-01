import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
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
  console.log('[Gemini] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Initialize response stream early
  const services = ServiceContainer.getInstance();
  const streamHandler = services.stream;
  const response = streamHandler.getResponse(corsHeaders);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Gemini] Handling OPTIONS request');
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log('[Gemini] Starting request processing');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      console.error('[Gemini] OpenAI API key missing');
      throw createAppError('OpenAI API key not configured', 'VALIDATION_ERROR');
    }

    console.log('[Gemini] Services initialized');

    const { content, chatId } = await req.json();
    console.log('[Gemini] Request payload:', { chatId, contentLength: content?.length });
    
    if (!content?.trim()) {
      console.error('[Gemini] Empty content received');
      throw createAppError('Message content is required', 'VALIDATION_ERROR');
    }

    // 1. Auth validation
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      console.error('[Gemini] Missing authorization header');
      throw createAppError('No authorization header', 'AUTH_ERROR');
    }

    const { data: { user }, error: authError } = await services.supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      console.error('[Gemini] Auth error:', { authError });
      throw createAppError('Invalid authorization', 'AUTH_ERROR');
    }

    console.log('[Gemini] Auth validated:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // 2. Get or create chat with validation
    const chat = await services.chat.getOrCreateChat(
      user.id, 
      chatId, 
      content.substring(0, 50)
    );

    if (!chat?.id) {
      console.error('[Gemini] Chat creation failed');
      throw createAppError('Failed to create or get chat', 'CHAT_ERROR');
    }

    console.log('[Gemini] Chat context established:', {
      chatId: chat.id,
      isNew: !chatId,
      timestamp: new Date().toISOString()
    });

    // 3. Initialize stream and send metadata
    await streamHandler.writeMetadata({ 
      chatId: chat.id,
      status: 'created',
      timestamp: new Date().toISOString()
    });

    // 4. Save user message
    const userMessage = await services.message.saveUserMessage(chat.id, content);
    console.log('[Gemini] User message saved:', {
      messageId: userMessage.id,
      timestamp: new Date().toISOString()
    });

    // 5. Create assistant message placeholder
    const assistantMessage = await services.message.saveAssistantMessage(chat.id);
    console.log('[Gemini] Assistant message created:', {
      messageId: assistantMessage.id,
      timestamp: new Date().toISOString()
    });

    // 6. Assemble context and process with OpenAI
    const context = await assembleContext(services.supabase, chat.id);
    console.log('[Gemini] Context assembled:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageHistoryCount: context.messageHistory.length,
      timestamp: new Date().toISOString()
    });

    const messages = [
      { role: 'system', content: context.systemInstructions },
      ...context.messageHistory,
      { role: 'user', content }
    ];

    if (context.patientContext) {
      messages.unshift({ 
        role: 'system', 
        content: `Patient Context:\n${context.patientContext}`
      });
    }

    // 7. Process with OpenAI and handle response
    await services.openai.streamCompletion(messages, async (chunk: string) => {
      await streamHandler.writeChunk(chunk);
    });

    console.log('[Gemini] Stream processing completed');
    await streamHandler.close();
    
    console.log('[Gemini] Returning response with headers:', corsHeaders);
    return response;

  } catch (error) {
    console.error('[Gemini] Function error:', {
      error,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Attempt to write error to stream before closing
      await streamHandler.writeError(error);
      await streamHandler.close();
    } catch (streamError) {
      console.error('[Gemini] Failed to write error to stream:', streamError);
    }

    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});