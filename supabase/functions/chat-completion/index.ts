
import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';

interface ChatRequest {
  chatId: string;
  content: string;
  type?: 'text' | 'audio';
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
    
    // Get auth user
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

    // Get request body
    const { chatId, content, type = 'text' } = await req.json() as ChatRequest;

    // Get chat context (template and patient info)
    const { data: chat } = await supabase
      .from('chats')
      .select(`
        id,
        template_id,
        patient_id,
        templates (
          system_instructions,
          content
        ),
        patients (
          name,
          dob,
          medical_history
        )
      `)
      .eq('id', chatId)
      .single();

    if (!chat) {
      throw new Error('Chat not found');
    }

    // Store user message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'user',
        content,
        type
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

    // Make OpenAI API call
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content }
        ],
        temperature: 0.7,
        response_format: { type: 'text' }
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
        chat_id: chatId,
        role: 'assistant',
        content: assistantMessage,
        type: 'text'
      });

    if (responseError) {
      throw responseError;
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
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
