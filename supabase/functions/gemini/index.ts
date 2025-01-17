import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatContext {
  templateInstructions?: string;
  patientContext?: string;
  messageHistory: { role: string; content: string }[];
}

async function fetchChatContext(supabase: any, chatId: string): Promise<{ templateType?: string; patientId?: string }> {
  console.log('Fetching chat context for:', chatId);
  const { data, error } = await supabase
    .from('chats')
    .select('template_type, patient_id')
    .eq('id', chatId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching chat context:', error);
    throw new Error('Failed to fetch chat context');
  }

  return {
    templateType: data?.template_type,
    patientId: data?.patient_id
  };
}

async function fetchPatientContext(supabase: any, patientId: string): Promise<string> {
  console.log('Fetching patient context for:', patientId);
  const { data, error } = await supabase
    .from('patients')
    .select('name, dob, medical_history, current_medications')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching patient context:', error);
    throw new Error('Failed to fetch patient context');
  }

  if (!data) return '';

  const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
  const medications = Array.isArray(data.current_medications) ? data.current_medications.join(', ') : '';
  
  return `Patient Information:
    Name: ${data.name}
    Age: ${age}
    Medical History: ${data.medical_history || 'None'}
    Current Medications: ${medications || 'None'}`;
}

async function fetchTemplateContext(supabase: any, chatId: string): Promise<string> {
  console.log('Fetching template context for:', chatId);
  const { data, error } = await supabase
    .from('template_contexts')
    .select('system_instructions')
    .eq('chat_id', chatId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching template context:', error);
    throw new Error('Failed to fetch template context');
  }

  return data?.system_instructions || '';
}

async function fetchChatHistory(supabase: any, chatId: string): Promise<{ role: string; content: string }[]> {
  console.log('Fetching chat history for:', chatId);
  const { data, error } = await supabase
    .from('messages')
    .select('content, sender')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw new Error('Failed to fetch chat history');
  }

  return data.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}

async function assembleContext(supabase: any, chatId: string): Promise<ChatContext> {
  console.log('Assembling context for chat:', chatId);
  
  // Fetch basic chat context
  const { templateType, patientId } = await fetchChatContext(supabase, chatId);
  
  // Parallel fetch of all required context
  const [templateInstructions, messageHistory, patientContext] = await Promise.all([
    templateType ? fetchTemplateContext(supabase, chatId) : Promise.resolve(''),
    fetchChatHistory(supabase, chatId),
    patientId ? fetchPatientContext(supabase, patientId) : Promise.resolve('')
  ]);

  return {
    templateInstructions,
    patientContext,
    messageHistory
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatId, content } = await req.json();
    
    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Assemble context
    const context = await assembleContext(supabase, chatId);
    console.log('Context assembled:', {
      hasTemplateInstructions: !!context.templateInstructions,
      hasPatientContext: !!context.patientContext,
      messageCount: context.messageHistory.length
    });

    // Prepare messages array for OpenAI
    const messages = [
      // System instructions from template if available
      ...(context.templateInstructions ? [{
        role: 'system',
        content: context.templateInstructions
      }] : []),
      // Patient context if available
      ...(context.patientContext ? [{
        role: 'system',
        content: context.patientContext
      }] : []),
      // Chat history
      ...context.messageHistory,
      // New message
      {
        role: 'user',
        content
      }
    ];

    console.log('Sending request to OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No content in OpenAI response');
    }

    return new Response(
      JSON.stringify({ content: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});