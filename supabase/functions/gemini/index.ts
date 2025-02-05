import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ServiceContainer } from "./services/ServiceContainer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Gemini] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    time: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    console.log('[Gemini] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('[Gemini] Request data:', {
      contentLength: requestData.content?.length,
      templateId: requestData.templateId,
      timestamp: new Date().toISOString()
    });

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('[Gemini] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenAIKey: !!openaiKey,
      time: new Date().toISOString()
    });

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    ServiceContainer.initialize(supabaseUrl, supabaseKey, openaiKey);
    const services = ServiceContainer.getInstance();

    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    console.log('[Gemini] Auth header:', {
      hasAuthHeader: !!authHeader,
      headerLength: authHeader?.length,
      time: new Date().toISOString()
    });

    if (!authHeader) {
      console.error('[Gemini] No authorization header');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await services.supabase.auth.getUser(authHeader);
    console.log('[Gemini] Auth result:', {
      hasUser: !!user,
      error: authError,
      time: new Date().toISOString()
    });

    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    // Create or get chat with template_id
    const chat = await services.chat.getOrCreateChat(
      user.id, 
      null, 
      requestData.content.substring(0, 50),
      requestData.templateId // Pass template_id to chat service
    );

    console.log('[Gemini] Chat created/retrieved:', {
      chatId: chat?.id,
      templateId: chat?.template_id,
      time: new Date().toISOString()
    });

    if (!chat?.id) {
      throw new Error('Failed to create chat');
    }

    // Save user message
    const userMessage = await services.message.saveUserMessage(chat.id, requestData.content);
    console.log('[Gemini] User message saved:', {
      messageId: userMessage.id,
      timestamp: new Date().toISOString()
    });

    // Create assistant message placeholder
    const assistantMessage = await services.message.saveAssistantMessage(chat.id);
    console.log('[Gemini] Assistant message created:', {
      messageId: assistantMessage.id,
      timestamp: new Date().toISOString()
    });

    // Generate stream URL with token
    const streamUrl = `${supabaseUrl}/functions/v1/gemini-stream?chatId=${chat.id}&token=${authHeader}`;
    
    return new Response(
      JSON.stringify({ streamUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

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