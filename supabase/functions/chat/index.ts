import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessageRequest {
  chatId: string;
  content: string;
  type: 'text' | 'audio';
}

interface ProcessingContext {
  templateInstructions: string;
  patientContext: {
    name?: string;
    dob?: string;
    medicalHistory?: string;
    currentMedications?: string[];
  } | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { chatId, content, type } = await req.json() as MessageRequest;
    console.log('Processing message:', { chatId, type });

    if (!chatId || !content) {
      throw new Error('Missing required fields');
    }

    // Get chat context with a single efficient query
    const { data: chatContext, error: contextError } = await supabaseClient
      .from('chats')
      .select(`
        *,
        templates!chats_template_type_fkey (
          system_instructions
        ),
        patients!chats_patient_id_fkey (
          name,
          dob,
          medical_history,
          current_medications
        )
      `)
      .eq('id', chatId)
      .single();

    if (contextError) {
      console.error('Error fetching chat context:', contextError);
      throw new Error('Failed to fetch chat context');
    }

    console.log('Retrieved chat context:', chatContext);

    // Prepare processing context
    const processingContext: ProcessingContext = {
      templateInstructions: chatContext?.templates?.system_instructions || 'Process conversation using standard medical documentation format.',
      patientContext: chatContext?.patients ? {
        name: chatContext.patients.name,
        dob: chatContext.patients.dob,
        medicalHistory: chatContext.patients.medical_history,
        currentMedications: chatContext.patients.current_medications,
      } : null
    };

    // Get message history (last 10 messages only)
    const { data: messageHistory, error: historyError } = await supabaseClient
      .from('messages')
      .select('content, sender')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      throw new Error('Failed to fetch message history');
    }

    // Process with AI
    const messages = [
      { role: 'system', content: processingContext.templateInstructions },
      ...(processingContext.patientContext ? [{
        role: 'system',
        content: `Patient Context:
          Name: ${processingContext.patientContext.name}
          DOB: ${processingContext.patientContext.dob}
          Medical History: ${processingContext.patientContext.medicalHistory || 'None'}
          Current Medications: ${processingContext.patientContext.currentMedications?.join(', ') || 'None'}`
      }] : []),
      ...messageHistory.reverse().map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content }
    ];

    // Call OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to process message with AI');
    }

    const aiData = await openAIResponse.json();
    const aiResponse = aiData.choices[0].message.content;

    // Save AI response
    const { error: saveError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        content: aiResponse,
        sender: 'assistant',
        type: 'text',
      });

    if (saveError) {
      console.error('Error saving AI response:', saveError);
      throw new Error('Failed to save AI response');
    }

    return new Response(
      JSON.stringify({ content: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing message:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'PROCESSING_ERROR'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});