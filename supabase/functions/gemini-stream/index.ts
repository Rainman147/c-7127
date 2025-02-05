import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ServiceContainer } from "../gemini/services/ServiceContainer.ts";

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Gemini-Stream] Request received:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      time: new Date().toISOString()
    });

    const url = new URL(req.url);
    const chatId = url.searchParams.get('chatId');
    const token = url.searchParams.get('token');
    
    console.log('[Gemini-Stream] Extracted params:', { 
      chatId, 
      hasToken: !!token,
      tokenLength: token?.length,
      time: new Date().toISOString()
    });

    if (!chatId || !token) {
      console.error('[Gemini-Stream] Missing required params:', { chatId, hasToken: !!token });
      throw new Error('Missing required parameters: chatId and token');
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      console.error('[Gemini-Stream] Missing env vars:', { 
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey,
        hasOpenAIKey: !!openaiKey
      });
      throw new Error('Missing required environment variables');
    }

    ServiceContainer.initialize(supabaseUrl, supabaseKey, openaiKey);
    const services = ServiceContainer.getInstance();
    const streamHandler = services.stream;
    const response = streamHandler.getResponse(corsHeaders);

    // Auth validation using token from URL
    console.log('[Gemini-Stream] Validating token...');
    const { data: { user }, error: authError } = await services.supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Gemini-Stream] Auth error:', { 
        error: authError,
        hasUser: !!user,
        time: new Date().toISOString()
      });
      throw new Error('Invalid token');
    }

    console.log('[Gemini-Stream] User authenticated:', {
      userId: user.id,
      time: new Date().toISOString()
    });

    // Get chat context
    const { data: chat, error: chatError } = await services.supabase
      .from('chats')
      .select('*, templates(*), patients(*)')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      console.error('[Gemini-Stream] Chat error:', {
        error: chatError,
        chatId,
        time: new Date().toISOString()
      });
      throw new Error('Failed to load chat context');
    }

    // Get message history
    const { data: messages } = await services.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    console.log('[Gemini-Stream] Retrieved messages:', {
      chatId,
      messageCount: messages?.length,
      time: new Date().toISOString()
    });

    // Initialize stream
    await streamHandler.writeMetadata({ 
      chatId,
      status: 'streaming',
      timestamp: new Date().toISOString()
    });

    // Process with OpenAI
    const messageHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    await services.openai.streamCompletion(messageHistory, async (chunk: string) => {
      await streamHandler.writeChunk(chunk);
    });

    console.log('[Gemini-Stream] Stream processing completed');
    await streamHandler.close();
    
    return response;

  } catch (error) {
    console.error('[Gemini-Stream] Function error:', {
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