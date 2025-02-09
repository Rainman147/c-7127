
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

    // Store user message immediately
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

    // Create transform stream for SSE parsing
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantMessage = '';

    const stream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(5));
              const content = data.choices[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                // Update the assistant message with new content
                const { error: updateError } = await authenticatedClient
                  .from('messages')
                  .update({ 
                    content: assistantMessage,
                    status: 'streaming'
                  })
                  .eq('id', pendingMessage.id);

                if (updateError) {
                  console.error('[direct-chat] Error updating streaming message:', updateError);
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch (error) {
              console.error('[direct-chat] Error parsing SSE:', error);
            }
          } else if (line === 'data: [DONE]') {
            // Update final message status
            const { error: finalUpdateError } = await authenticatedClient
              .from('messages')
              .update({ 
                content: assistantMessage,
                status: 'delivered'
              })
              .eq('id', pendingMessage.id);

            if (finalUpdateError) {
              console.error('[direct-chat] Error updating final message:', finalUpdateError);
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }
        }
      }
    });

    console.log('[direct-chat] Making streaming OpenAI request');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages: [
          { role: 'user', content }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[direct-chat] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.statusText}. Details: ${errorText}`);
    }

    return new Response(response.body?.pipeThrough(stream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
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
