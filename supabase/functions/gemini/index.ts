import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assembleContext } from "./utils/contextAssembler.ts";
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
    const { content, chatId } = await req.json();
    
    if (!content?.trim()) {
      throw createAppError('Message content is required', 'VALIDATION_ERROR');
    }

    console.log('Processing message:', {
      hasContent: !!content,
      chatId
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

    // Create or verify chat
    let activeChatId = chatId;
    if (!chatId) {
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          title: content.substring(0, 50),
          user_id: user.id
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

    // Assemble context
    const context = await assembleContext(supabase, activeChatId);
    console.log('Assembled context:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageHistoryCount: context.messageHistory.length
    });

    // Save user message
    const { data: savedUserMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        role: 'user',
        content: content,
        type: 'text',
        status: 'delivered'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving user message:', messageError);
      throw createAppError('Failed to save message', 'DATABASE_ERROR');
    }

    // Create initial assistant message
    const { data: savedAssistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        role: 'assistant',
        content: '',
        type: 'text',
        status: 'processing'
      })
      .select()
      .single();

    if (assistantError) {
      console.error('Error creating assistant message:', assistantError);
      throw createAppError('Failed to create assistant message', 'DATABASE_ERROR');
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: context.systemInstructions },
      ...context.messageHistory,
      { role: 'user', content }
    ];

    if (context.patientContext) {
      messages.unshift({ 
        role: 'system', 
        content: `Patient Context:\n${context.patientContext}`
      });
    }

    // Start streaming response
    const streamResponse = streamHandler.getResponse(corsHeaders);
    const writer = streamHandler.getWriter();

    // Process with OpenAI
    openaiService.streamCompletion(messages, writer)
      .then(async (fullResponse) => {
        // Update assistant message
        await supabase
          .from('messages')
          .update({ 
            status: 'delivered',
            content: fullResponse,
          })
          .eq('id', savedAssistantMessage.id);
        
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
          .eq('id', savedAssistantMessage.id);
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