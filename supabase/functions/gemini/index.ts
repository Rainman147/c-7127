import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { MessageService } from "./services/messageService.ts";
import { OpenAIService } from "./services/openaiService.ts";
import { StreamHandler } from "./utils/streamHandler.ts";

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
    const { chatId, content, type = 'text' } = await req.json();
    
    if (!chatId) {
      throw createAppError('Chat ID is required', 'VALIDATION_ERROR');
    }

    console.log(`Processing ${type} message for chat ${chatId}`, {
      contentLength: content.length,
      type
    });

    const messageService = new MessageService(supabaseUrl, supabaseKey);
    const openaiService = new OpenAIService(apiKey);
    const streamHandler = new StreamHandler();

    // Save user message
    const userMessage = await messageService.saveUserMessage(chatId, content, type);

    // Assemble context
    const context = await assembleContext(messageService.supabase, chatId);
    console.log('Context assembled:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageCount: context.messageHistory.length
    });

    // Prepare messages array
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
    const assistantMessage = await messageService.saveAssistantMessage(chatId);

    // Start streaming response
    const streamResponse = streamHandler.getResponse(corsHeaders);
    const writer = streamHandler.getWriter();

    // Process with OpenAI
    openaiService.streamCompletion(messages, writer)
      .then(async (fullResponse) => {
        // Mark message as delivered
        await messageService.updateMessageStatus(assistantMessage.id, 'delivered', fullResponse);
        // Update chat timestamp
        await messageService.updateChatTimestamp(chatId);
        
        console.log('Processing completed successfully', {
          chatId,
          responseLength: fullResponse.length
        });
      })
      .catch(async (error) => {
        console.error('Streaming error:', error);
        const errorResponse = handleError(error);
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorResponse })}\n\n`));
        
        // Update message status to failed
        await messageService.updateMessageStatus(assistantMessage.id, 'failed');
      })
      .finally(async () => {
        await streamHandler.close();
      });

    return streamResponse;

  } catch (error) {
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