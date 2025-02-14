
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

async function getChatContext(authenticatedClient, chatId) {
  console.log('[direct-chat] Getting chat context for:', chatId);
  
  try {
    // Get last 10 messages with performance tracking
    const startTime = Date.now();
    const { data: recentMessages, error: messagesError } = await authenticatedClient
      .from('messages')
      .select('role, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('[direct-chat] Error fetching recent messages:', messagesError);
      return { recentMessages: [], olderCount: 0 }; // Graceful fallback
    }

    console.log('[direct-chat] Messages query took:', Date.now() - startTime, 'ms');

    // Safely handle empty messages case
    if (!recentMessages || recentMessages.length === 0) {
      return { recentMessages: [], olderCount: 0 };
    }

    // Get count of older messages with proper error handling
    let olderCount = 0;
    const lastMessage = recentMessages[recentMessages.length - 1];
    
    const { count, error: countError } = await authenticatedClient
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .lt('created_at', lastMessage.created_at);

    if (countError) {
      console.error('[direct-chat] Error counting older messages:', countError);
    } else {
      olderCount = count || 0;
    }

    console.log('[direct-chat] Context stats:', {
      recentCount: recentMessages.length,
      olderCount,
      oldestMessageDate: lastMessage.created_at
    });

    return {
      recentMessages: recentMessages.reverse(), // Convert to chronological order
      olderCount
    };
  } catch (error) {
    console.error('[direct-chat] Unexpected error in getChatContext:', error);
    return { recentMessages: [], olderCount: 0 }; // Graceful fallback
  }
}

function formatContextualMessage(currentContent, recentMessages, olderCount) {
  try {
    let formattedContent = '';
    
    // Add context header if there are older messages
    if (olderCount > 0) {
      formattedContent += `[Context: This conversation has ${olderCount} previous messages before the following recent exchanges]\n\n`;
    }
    
    // Add recent conversation context with clear section markers
    if (recentMessages.length > 0) {
      formattedContent += '=== Previous Messages ===\n\n';
      formattedContent += recentMessages
        .map(msg => {
          const speaker = msg.role === 'user' ? 'User' : 'Assistant';
          return `${speaker}: ${msg.content.trim()}`; // Ensure clean formatting
        })
        .join('\n\n');
      
      formattedContent += '\n\n=== Current Message ===\n\n';
    }
      
    // Add current message
    formattedContent += `User: ${currentContent.trim()}`;
    
    return formattedContent;
  } catch (error) {
    console.error('[direct-chat] Error formatting context:', error);
    return currentContent; // Fallback to just the current message
  }
}

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

    // Add retry logic for chat verification
    let retryCount = 0;
    const maxRetries = 3;
    let chat;
    let chatError;

    while (retryCount < maxRetries) {
      console.log(`[direct-chat] Attempting to verify chat (attempt ${retryCount + 1}):`, chatId);
      
      const result = await authenticatedClient
        .from('chats')
        .select('id, user_id')
        .eq('id', chatId)
        .single();
      
      if (!result.error && result.data) {
        chat = result.data;
        break;
      }
      
      chatError = result.error;
      console.log(`[direct-chat] Verification attempt ${retryCount + 1} failed:`, result.error);
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      retryCount++;
    }

    if (!chat) {
      console.error('[direct-chat] Chat verification failed after retries:', {
        chatId,
        error: chatError,
        userId: user.id
      });
      throw new Error('Chat not found or access denied');
    }

    if (chat.user_id !== user.id) {
      console.error('[direct-chat] Chat ownership mismatch:', {
        chatUserId: chat.user_id,
        requestUserId: user.id
      });
      throw new Error('Access denied');
    }

    // Get chat context with performance tracking
    const contextStartTime = Date.now();
    const { recentMessages, olderCount } = await getChatContext(authenticatedClient, chatId);
    console.log('[direct-chat] Context retrieval took:', Date.now() - contextStartTime, 'ms');
    console.log('[direct-chat] Retrieved context:', {
      recentMessagesCount: recentMessages.length,
      olderMessagesCount: olderCount
    });

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

    // Format the contextual message for the AI with performance tracking
    const formatStartTime = Date.now();
    const contextualContent = formatContextualMessage(content, recentMessages, olderCount);
    console.log('[direct-chat] Context formatting took:', Date.now() - formatStartTime, 'ms');
    console.log('[direct-chat] Formatted contextual content length:', contextualContent.length);

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
          { role: 'user', content: contextualContent }
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
