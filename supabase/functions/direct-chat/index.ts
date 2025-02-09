
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
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[direct-chat] No authorization header provided');
      throw new Error('Authentication required');
    }

    // Extract JWT token
    const jwt = authHeader.replace('Bearer ', '');
    
    // Create an initial Supabase client for auth verification
    const initialClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Verify the user's token
    const { data: { user }, error: userError } = await initialClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error('[direct-chat] Authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('[direct-chat] Authenticated user:', user.id);

    // Create a new Supabase client with the verified JWT token
    const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`
        }
      }
    });

    const { content, chatId } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
    }

    // Verify chat ownership
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

    // Store user message
    console.log('[direct-chat] Storing user message for chat:', chatId);
    const { error: userMessageError } = await authenticatedClient
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content,
        type: 'text',
        metadata: {},
        status: 'delivered'
      });

    if (userMessageError) {
      console.error('[direct-chat] Error storing user message:', userMessageError);
      throw new Error('Failed to store user message');
    }

    // Create pending assistant message
    console.log('[direct-chat] Creating pending assistant message');
    const { data: pendingMessage, error: pendingMessageError } = await authenticatedClient
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: '',
        type: 'text',
        metadata: {},
        status: 'pending'
      })
      .select()
      .single();

    if (pendingMessageError || !pendingMessage) {
      console.error('[direct-chat] Error creating pending message:', pendingMessageError);
      throw new Error('Failed to create pending message');
    }

    // Make OpenAI request
    console.log('[direct-chat] Making OpenAI request');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content }
        ]
      })
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('[direct-chat] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const completion = await openAIResponse.json();
    const assistantMessage = completion.choices[0].message.content;

    // Update assistant message with response
    const { error: updateError } = await authenticatedClient
      .from('messages')
      .update({ 
        content: assistantMessage,
        status: 'delivered'
      })
      .eq('id', pendingMessage.id);

    if (updateError) {
      console.error('[direct-chat] Error updating assistant message:', updateError);
      throw new Error('Failed to update assistant message');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

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
