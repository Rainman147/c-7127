import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ServiceContainer } from "../gemini/services/ServiceContainer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    console.log('[Gemini-Stream] Handling CORS preflight');
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
    const debugMode = url.searchParams.get('debug') === 'true';
    
    if (!chatId || (!token && !debugMode)) {
      console.error('[Gemini-Stream] Missing required params:', { chatId, hasToken: !!token });
      throw new Error('Missing required parameters: chatId and token');
    }

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    ServiceContainer.initialize(supabaseUrl, supabaseKey, openaiKey);
    const services = ServiceContainer.getInstance();

    let userId = 'debug-user';

    // Skip auth in debug mode
    if (!debugMode) {
      const { data: { user }, error: authError } = await services.supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('[Gemini-Stream] Auth error:', { error: authError });
        throw new Error('Invalid token');
      }
      userId = user.id;
    }

    // Get chat with template data
    const { data: chat, error: chatError } = await services.supabase
      .from('chats')
      .select(`
        *,
        templates (
          id,
          name,
          system_instructions,
          content,
          instructions
        ),
        patients (*)
      `)
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      console.error('[Gemini-Stream] Chat error:', { error: chatError });
      throw new Error('Failed to load chat context');
    }

    // Get message history
    const { data: messages } = await services.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    const messageHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add system instructions from template if available
    if (chat.templates?.system_instructions) {
      messageHistory.unshift({
        role: 'system',
        content: chat.templates.system_instructions
      });
    }

    console.log('[Gemini-Stream] Making OpenAI request with:', {
      messageCount: messageHistory.length,
      hasSystemInstructions: !!chat.templates?.system_instructions
    });

    // Direct OpenAI call without streaming
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messageHistory,
        stream: false
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const completion = await openAIResponse.json();
    const assistantMessage = completion.choices[0].message.content;

    // Save assistant message to database
    const { error: saveError } = await services.supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text',
        status: 'delivered'
      });

    if (saveError) {
      console.error('[Gemini-Stream] Error saving message:', saveError);
      throw new Error('Failed to save assistant message');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: assistantMessage 
      }), 
      { 
        status: 200,
        headers: corsHeaders
      }
    );

  } catch (error) {
    console.error('[Gemini-Stream] Function error:', {
      error,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: false
      }), 
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});