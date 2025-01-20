import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { StreamHandler } from "./utils/streamHandler.ts";
import { OpenAIService } from "./services/openaiService.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw createAppError('OpenAI API key not configured', 'VALIDATION_ERROR');
  }

  try {
    const { content, chatId, templateId, patientId, type = 'text' } = await req.json();
    
    if (!content?.trim()) {
      throw createAppError('Message content is required', 'VALIDATION_ERROR');
    }

    console.log(`Processing ${type} message:`, {
      hasContent: !!content,
      chatId,
      templateId,
      patientId
    });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openaiService = new OpenAIService(apiKey);
    const streamHandler = new StreamHandler();

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw createAppError('No authorization header', 'VALIDATION_ERROR');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw createAppError('Invalid authorization', 'VALIDATION_ERROR');
    }

    // Validate template if provided
    if (templateId) {
      const { data: template } = await supabase
        .from('templates')
        .select('id')
        .eq('id', templateId)
        .maybeSingle();
        
      if (!template) {
        throw createAppError('Invalid template ID', 'VALIDATION_ERROR');
      }
    }

    // Validate patient if provided
    if (patientId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle();
        
      if (!patient) {
        throw createAppError('Invalid patient ID', 'VALIDATION_ERROR');
      }
    }

    // Create new chat if needed
    let activeChatId = chatId;
    if (!chatId) {
      console.log('Creating new chat with context:', { templateId, patientId });
      
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          title: content.substring(0, 50), // Use first 50 chars of message as title
          user_id: user.id,
          template_type: templateId,
          patient_id: patientId
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat:', chatError);
        throw createAppError('Failed to create chat', 'DATABASE_ERROR');
      }

      activeChatId = newChat.id;
      console.log('Created new chat:', activeChatId);
    }

    // Save user message
    const { data: userMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        content: content,
        sender: 'user',
        type: type,
        sequence: 1,
        status: 'delivered'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving user message:', messageError);
      throw createAppError('Failed to save message', 'DATABASE_ERROR');
    }

    // Assemble context
    const context = await assembleContext(supabase, activeChatId, templateId, patientId);
    console.log('Context assembled:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageCount: context.messageHistory.length
    });

    // Prepare messages array for AI
    const messages = [
      ...(context.systemInstructions ? [{
        role: 'system',
        content: context.systemInstructions
      }] : []),
      ...(context.patientContext ? [{
        role: 'system',
        content: context.patientContext
      }] : []),
      ...context.messageHistory,
      { role: 'user', content, type }
    ];

    // Save initial assistant message
    const { data: assistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        content: '',
        sender: 'assistant',
        type: 'text',
        sequence: 2,
        status: 'processing'
      })
      .select()
      .single();

    if (assistantError) {
      console.error('Error creating assistant message:', assistantError);
      throw createAppError('Failed to create assistant message', 'DATABASE_ERROR');
    }

    // Start streaming response
    const streamResponse = streamHandler.getResponse(corsHeaders);
    const writer = streamHandler.getWriter();

    // Process with OpenAI
    openaiService.streamCompletion(messages, writer)
      .then(async (fullResponse) => {
        // Mark message as delivered
        await supabase
          .from('messages')
          .update({ 
            status: 'delivered',
            content: fullResponse,
            delivered_at: new Date().toISOString()
          })
          .eq('id', assistantMessage.id);

        // Update chat timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeChatId);
        
        console.log('Processing completed successfully', {
          chatId: activeChatId,
          responseLength: fullResponse.length
        });
      })
      .catch(async (error) => {
        console.error('Streaming error:', error);
        const errorResponse = handleError(error);
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorResponse })}\n\n`));
        
        // Update message status to failed
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', assistantMessage.id);
      })
      .finally(async () => {
        await streamHandler.close();
      });

    return streamResponse;

  } catch (error) {
    console.error('Error in Gemini function:', error);
    const errorResponse = handleError(error);
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: errorResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to assemble context
async function assembleContext(supabase: any, chatId: string, templateId?: string, patientId?: string) {
  console.log('[contextAssembler] Assembling context:', { chatId, templateId, patientId });
  
  // Get template instructions if exists
  let systemInstructions = 'Process conversation using standard medical documentation format.';
  if (templateId) {
    const { data: template } = await supabase
      .from('templates')
      .select('system_instructions')
      .eq('id', templateId)
      .maybeSingle();
    
    if (template?.system_instructions) {
      systemInstructions = template.system_instructions;
    }
  }

  // Get patient context if exists
  let patientContext = null;
  if (patientId) {
    const { data: patient } = await supabase
      .from('patients')
      .select('name, dob, medical_history, current_medications')
      .eq('id', patientId)
      .maybeSingle();

    if (patient) {
      patientContext = `Patient Information:
Name: ${patient.name}
Age: ${calculateAge(patient.dob)}
${patient.medical_history ? `Medical History: ${patient.medical_history}` : ''}
${patient.current_medications?.length ? `Current Medications: ${patient.current_medications.join(', ')}` : ''}`.trim();
    }
  }

  // Get message history (empty for new chats)
  const messageHistory: any[] = [];

  console.log('[contextAssembler] Context assembly complete:', {
    hasSystemInstructions: systemInstructions !== 'Process conversation using standard medical documentation format.',
    hasPatientContext: !!patientContext,
    messageCount: messageHistory.length
  });

  return {
    systemInstructions,
    patientContext,
    messageHistory
  };
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}