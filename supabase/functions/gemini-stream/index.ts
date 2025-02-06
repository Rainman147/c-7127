import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { ServiceContainer } from "../gemini/services/ServiceContainer.ts";
import { createAppError } from "../gemini/utils/errorHandler.ts";

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

    const requestData = await req.json();
    const { content, chatId, templateId, patientId, debug } = requestData;
    
    if (!content) {
      throw createAppError('Missing content parameter', 'VALIDATION_ERROR');
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
    let currentChatId = chatId;

    // Skip auth in debug mode
    if (!debug) {
      const token = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (!token) {
        throw new Error('No authorization header');
      }

      const { data: { user }, error: authError } = await services.supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('[Gemini-Stream] Auth error:', { error: authError });
        throw new Error('Invalid token');
      }
      userId = user.id;

      // Create new chat if needed
      if (!currentChatId) {
        console.log('[Gemini-Stream] Creating new chat');
        const { data: chat, error: chatError } = await services.supabase
          .from('chats')
          .insert({
            user_id: userId,
            title: content.substring(0, 50),
            template_id: templateId || null,
            patient_id: patientId || null
          })
          .select()
          .single();

        if (chatError) {
          console.error('[Gemini-Stream] Chat creation error:', chatError);
          throw new Error('Failed to create chat');
        }

        currentChatId = chat.id;
        console.log('[Gemini-Stream] Created new chat:', currentChatId);
      } else {
        // Verify chat ownership
        const { data: chat, error: chatError } = await services.supabase
          .from('chats')
          .select('id')
          .eq('id', currentChatId)
          .eq('user_id', userId)
          .maybeSingle();

        if (chatError || !chat) {
          console.error('[Gemini-Stream] Chat verification failed:', chatError);
          throw new Error('Invalid chat session');
        }
      }
    }

    // Save user message
    const { error: userMessageError } = await services.supabase
      .from('messages')
      .insert({
        chat_id: currentChatId,
        role: 'user',
        content,
        type: 'text',
        status: 'delivered'
      });

    if (userMessageError) {
      console.error('[Gemini-Stream] User message insert failed:', userMessageError);
      throw userMessageError;
    }

    // Get message history and context
    const { data: messages } = await services.supabase
      .from('messages')
      .select('*')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true });

    const messageHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Get template context if available
    if (templateId) {
      const { data: template } = await services.supabase
        .from('templates')
        .select('system_instructions')
        .eq('id', templateId)
        .maybeSingle();

      if (template?.system_instructions) {
        messageHistory.unshift({
          role: 'system',
          content: template.system_instructions
        });
      }
    }

    console.log('[Gemini-Stream] Making OpenAI request with:', {
      messageCount: messageHistory.length,
      hasSystemInstructions: messageHistory[0]?.role === 'system'
    });

    // Direct OpenAI call without streaming
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: messageHistory,
        stream: false
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const completion = await openAIResponse.json();
    const assistantMessage = completion.choices[0].message.content;

    // Save assistant message
    const { error: saveError } = await services.supabase
      .from('messages')
      .insert({
        chat_id: currentChatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text',
        status: 'delivered'
      });

    if (saveError) {
      console.error('[Gemini-Stream] Error saving message:', saveError);
      throw new Error('Failed to save assistant message');
    }

    const responseData = {
      success: true,
      message: assistantMessage,
      chatId: currentChatId,
      isNewChat: !chatId
    };

    return new Response(
      JSON.stringify(responseData), 
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