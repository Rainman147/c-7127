import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { StreamHandler } from "./utils/streamHandler.ts";
import { OpenAIService } from "./services/openaiService.ts";
import { ChatService } from "./services/chatService.ts";
import { MessageService } from "./services/messageService.ts";

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

    console.log('[Gemini] Processing message:', {
      hasContent: !!content,
      chatId,
      timestamp: new Date().toISOString()
    });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const chatService = new ChatService(supabaseUrl, supabaseKey);
    const messageService = new MessageService(supabaseUrl, supabaseKey);
    const openaiService = new OpenAIService(apiKey);
    const streamHandler = new StreamHandler();

    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw createAppError('No authorization header', 'VALIDATION_ERROR');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw createAppError('Invalid authorization', 'VALIDATION_ERROR');
    }

    console.log('[Gemini] User authenticated:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // Get or create chat session
    const chat = await chatService.getOrCreateChat(user.id, chatId, content.substring(0, 50));
    console.log('[Gemini] Chat context:', {
      chatId: chat.id,
      isNew: !chatId,
      timestamp: new Date().toISOString()
    });

    // Initialize stream response
    const streamResponse = streamHandler.getResponse(corsHeaders);

    // Send initial metadata with chat ID
    await streamHandler.writeMetadata({ chatId: chat.id });
    console.log('[Gemini] Sent metadata:', {
      chatId: chat.id,
      timestamp: new Date().toISOString()
    });

    // Save user message
    const userMessage = await messageService.saveUserMessage(chat.id, content);
    console.log('[Gemini] Saved user message:', {
      messageId: userMessage.id,
      timestamp: new Date().toISOString()
    });

    // Create initial assistant message placeholder
    const assistantMessage = await messageService.saveAssistantMessage(chat.id);
    console.log('[Gemini] Created assistant message:', {
      messageId: assistantMessage.id,
      timestamp: new Date().toISOString()
    });

    // Assemble context
    const context = await assembleContext(supabase, chat.id);
    console.log('[Gemini] Assembled context:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageHistoryCount: context.messageHistory.length,
      timestamp: new Date().toISOString()
    });

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

    console.log('[Gemini] Starting OpenAI stream with messages:', {
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });

    // Process with OpenAI and handle response
    openaiService.streamCompletion(messages, async (chunk: string) => {
      await streamHandler.writeChunk(chunk);
    })
    .then(async (fullResponse) => {
      await messageService.updateMessageStatus(
        assistantMessage.id,
        'delivered',
        fullResponse
      );
      
      console.log('[Gemini] Processing completed successfully', {
        chatId: chat.id,
        responseLength: fullResponse.length,
        timestamp: new Date().toISOString()
      });
    })
    .catch(async (error) => {
      console.error('[Gemini] Streaming error:', {
        error,
        chatId: chat.id,
        timestamp: new Date().toISOString()
      });
      
      const errorResponse = handleError(error);
      await streamHandler.writeChunk(JSON.stringify({ error: errorResponse }));
      
      await messageService.updateMessageStatus(
        assistantMessage.id,
        'failed'
      );
    })
    .finally(async () => {
      await streamHandler.close();
      console.log('[Gemini] Stream closed:', {
        chatId: chat.id,
        timestamp: new Date().toISOString()
      });
    });

    return streamResponse;

  } catch (error) {
    console.error('[Gemini] Function error:', {
      error,
      timestamp: new Date().toISOString()
    });
    
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