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
      throw createAppError('Only POST method is allowed', 'VALIDATION_ERROR');
    }

    // Validate Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('[Gemini] Invalid Content-Type:', contentType);
      throw createAppError('Content-Type must be application/json', 'VALIDATION_ERROR');
    }

    // Log raw request details before parsing
    console.log('[Gemini] Raw request details:', {
      bodyUsed: req.bodyUsed,
      contentType,
      contentLength: req.headers.get('content-length'),
      time: new Date().toISOString()
    });

    // Clone request for logging
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    console.log('[Gemini] Raw body received:', {
      length: rawBody.length,
      preview: rawBody.substring(0, 100),
      time: new Date().toISOString()
    });

    if (!rawBody) {
      console.error('[Gemini] Empty request body received');
      throw createAppError('Request body is empty', 'VALIDATION_ERROR');
    }

    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log('[Gemini] Successfully parsed request data:', {
        hasContent: !!requestData.content,
        contentLength: requestData.content?.length,
        chatId: requestData.chatId,
        action: requestData.action,
        hasTemplate: !!requestData.templateContext,
        hasPatient: !!requestData.patientContext,
        time: new Date().toISOString()
      });
    } catch (parseError) {
      console.error('[Gemini] JSON parsing error:', {
        error: parseError.message,
        rawBody,
        time: new Date().toISOString()
      });
      throw createAppError('Invalid JSON payload', 'VALIDATION_ERROR');
    }

    // Initialize ServiceContainer
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Gemini] Missing Supabase configuration');
      throw createAppError('Supabase configuration missing', 'VALIDATION_ERROR');
    }

    if (!openaiKey) {
      console.error('[Gemini] OpenAI API key missing');
      throw createAppError('OpenAI API key not configured', 'VALIDATION_ERROR');
    }

    // Initialize ServiceContainer before getting instance
    console.log('[Gemini] Initializing ServiceContainer');
    ServiceContainer.initialize(supabaseUrl, supabaseKey, openaiKey);
    
    // Get services after initialization
    const services = ServiceContainer.getInstance();
    const streamHandler = services.stream;
    const response = streamHandler.getResponse(corsHeaders);

    console.log('[Gemini] Starting request processing with services');
    
    const { content, chatId } = requestData;
    
    console.log('[Gemini] Extracted request data:', { 
      chatId, 
      contentLength: content?.length,
      time: new Date().toISOString()
    });
    
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
      message: error.message,
      code: error.code,
      stack: error.stack,
      time: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        retryable: error.retryable || false
      }), 
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});