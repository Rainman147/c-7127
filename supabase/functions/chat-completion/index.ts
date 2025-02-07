
import { serve } from "https://deno.fresh.dev/std@v1/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { content, type = 'text', templateId, patientId, chatId } = await req.json() as ChatRequest;
    let activeChatId = chatId;

    if (!activeChatId) {
      console.log('Creating new chat:', { templateId, patientId });
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
        throw chatError;
      }
      
      activeChatId = newChat.id;
      console.log('Created new chat:', activeChatId);
    }

    const { data: chat } = await supabase
      .from('chats')
      .select(`
        id,
        template_id,
        patient_id,
        templates (
          system_instructions,
          content,
          schema
        ),
        patients (
          name,
          dob,
          medical_history
        )
      `)
      .eq('id', activeChatId)
      .single();

    if (!chat) {
      throw new Error('Chat not found');
    }

    const { error: messageError } = await supabase
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

    if (messageError) {
      throw messageError;
    }

    // Build system context
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

    console.log('Making OpenAI request with model o3-mini');
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'o3-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content }
        ],
        temperature: 0.7,
        response_format: responseFormat
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const completion = await openAIResponse.json();
    const assistantMessage = completion.choices[0].message.content;

    // Store assistant response
    const { error: responseError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text'
      });

    if (responseError) {
      throw responseError;
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        chatId: activeChatId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in chat completion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
