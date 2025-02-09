import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[direct-chat] Received request:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[direct-chat] No authorization header provided');
      throw new Error('Authentication required');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const initialClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await initialClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error('[direct-chat] Authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('[direct-chat] Authenticated user:', user.id);

    const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    });

    const { content, chatId, metadata } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    const { data: chat, error: chatError } = await authenticatedClient
      .from('chats')
      .select('user_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      console.error('[direct-chat] Chat verification error:', chatError);
      throw new Error('Chat not found or access denied');
    }

    if (chat.user_id !== user.id) {
      console.error('[direct-chat] Chat ownership mismatch:', { chatUserId: chat.user_id, requestUserId: user.id });
      throw new Error('Access denied');
    }

    const now = new Date().toISOString();
    const sortIndex = metadata?.sortIndex || 0;

    // Store user message with tempId from optimistic update
    console.log('[direct-chat] Storing user message for chat:', chatId);
    const { error: userMessageError } = await authenticatedClient
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content,
        type: 'text',
        metadata: { ...metadata, sortIndex },
        status: 'delivered',
        created_at: now
      });

    if (userMessageError) {
      console.error('[direct-chat] Error storing user message:', userMessageError);
      throw new Error('Failed to store user message');
    }

    console.log('[direct-chat] Making OpenAI request with model: o1-mini');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Format your responses using markdown for better readability. Use code blocks with language specification for code, and proper headings, lists, and emphasis where appropriate.'
          },
          { role: 'user', content }
        ]
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[direct-chat] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}. Details: ${errorText}`);
    }

    const completion = await openAIResponse.json();
    
    if (!completion?.choices?.[0]?.message?.content) {
      console.error('[direct-chat] Invalid OpenAI response:', completion);
      throw new Error('Invalid response from OpenAI API');
    }

    const assistantMessage = completion.choices[0].message.content;
    const assistantMessageTime = new Date(new Date(now).getTime() + 1000).toISOString(); // 1 second after user message

    console.log('[direct-chat] Storing assistant message for chat:', chatId);
    const { error: assistantMessageError } = await authenticatedClient
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text',
        metadata: { sortIndex: sortIndex + 1 },
        status: 'delivered',
        created_at: assistantMessageTime
      });

    if (assistantMessageError) {
      console.error('[direct-chat] Error storing assistant message:', assistantMessageError);
      throw new Error('Failed to store assistant message');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        metadata
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('[direct-chat] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        status: error.message?.includes('Authentication') ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
