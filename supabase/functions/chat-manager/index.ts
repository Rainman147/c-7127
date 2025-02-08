
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface ChatRequest {
  content: string;
  type?: 'text' | 'audio';
  templateId?: string;
  patientId?: string;
  chatId?: string;
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[chat-manager] No authorization header provided');
      throw new Error('Authentication required');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError) {
      console.error('[chat-manager] User authentication error:', userError);
      throw new Error('Invalid authentication token');
    }

    if (!user) {
      console.error('[chat-manager] No user found with provided token');
      throw new Error('User not found');
    }

    console.log('[chat-manager] Authenticated user:', user.id);

    // Parse request
    const { content, type = 'text', templateId, patientId, chatId } = await req.json() as ChatRequest;
    let activeChatId = chatId;

    console.log('[chat-manager] Processing chat request:', { content, type, templateId, patientId, chatId });

    // Create new chat if needed
    if (!activeChatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: content.slice(0, 50) + '...',
          template_id: templateId,
          patient_id: patientId
        })
        .select()
        .single();

      if (chatError) {
        console.error('[chat-manager] Error creating chat:', chatError);
        throw new Error('Failed to create new chat');
      }
      
      activeChatId = newChat.id;
      console.log('[chat-manager] Created new chat:', activeChatId);
    }

    // Get chat context - Updated query with optional joins
    console.log('[chat-manager] Fetching chat context for chat:', activeChatId);
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        id,
        template_id,
        patient_id,
        templates:template_id (
          system_instructions,
          content,
          schema
        ),
        patients:patient_id (
          name,
          dob,
          medical_history
        )
      `)
      .eq('id', activeChatId)
      .maybeSingle();

    if (chatError) {
      console.error('[chat-manager] Error fetching chat:', chatError);
      throw new Error('Failed to fetch chat data');
    }

    if (!chat) {
      console.error('[chat-manager] No chat found with ID:', activeChatId);
      throw new Error('Chat not found');
    }

    // Store user message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        role: 'user',
        content,
        type,
        metadata: {
          isFirstMessage: !chatId
        }
      });

    if (userMessageError) {
      console.error('[chat-manager] Error storing user message:', userMessageError);
      throw new Error('Failed to store user message');
    }

    // Build system context - Handle optional template/patient data
    let systemContext = 'You are a helpful medical AI assistant.';
    if (chat.templates?.system_instructions) {
      systemContext = chat.templates.system_instructions;
    }
    if (chat.patients) {
      systemContext += `\nPatient Context:\nName: ${chat.patients.name}\nDOB: ${chat.patients.dob}\nMedical History: ${chat.patients.medical_history || 'None provided'}`;
    }

    // Prepare response format if template has schema
    const responseFormat = chat.templates?.schema ? {
      type: "object",
      schema: chat.templates.schema
    } : undefined;

    // Get AI response
    console.log('[chat-manager] Making OpenAI request with model gpt-4o-mini');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content }
        ],
        temperature: 0.7,
        response_format: responseFormat
      })
    });

    if (!openAIResponse.ok) {
      console.error('[chat-manager] OpenAI API error:', await openAIResponse.text());
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const completion = await openAIResponse.json();
    const assistantMessage = completion.choices[0].message.content;

    // Store assistant response
    const { error: assistantMessageError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text'
      });

    if (assistantMessageError) {
      console.error('[chat-manager] Error storing assistant message:', assistantMessageError);
      throw new Error('Failed to store assistant message');
    }

    // Get all messages for the chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', activeChatId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[chat-manager] Error fetching messages:', messagesError);
      throw new Error('Failed to fetch messages');
    }

    return new Response(
      JSON.stringify({ 
        chatId: activeChatId,
        messages
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('[chat-manager] Error:', error);
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
