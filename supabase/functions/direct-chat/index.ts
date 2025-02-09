
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[direct-chat] No authorization header provided');
      throw new Error('Authentication required');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('[direct-chat] Authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    console.log('[direct-chat] Authenticated user:', user.id);

    const { content, chatId } = await req.json();
    
    if (!content) {
      throw new Error('Content is required');
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

    // Store messages in the database
    const { error: userMessageError } = await supabase
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

    const { error: assistantMessageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text',
        metadata: {},
        status: 'delivered'
      });

    if (assistantMessageError) {
      console.error('[direct-chat] Error storing assistant message:', assistantMessageError);
      throw new Error('Failed to store assistant message');
    }

    // Get all messages for the chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[direct-chat] Error fetching messages:', messagesError);
      throw new Error('Failed to fetch messages');
    }

    return new Response(
      JSON.stringify({ messages }),
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
