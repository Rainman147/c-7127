import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { ServiceContainer } from "./services/ServiceContainer.ts";

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
    // Initialize services
    const services = ServiceContainer.initialize(supabaseUrl, supabaseKey, apiKey);
    console.log('[Gemini] Services initialized');

    const { content, chatId } = await req.json();
    
    if (!content?.trim()) {
      throw createAppError('Message content is required', 'VALIDATION_ERROR');
    }

    console.log('[Gemini] Starting request processing:', {
      hasContent: !!content,
      chatId,
      timestamp: new Date().toISOString()
    });

    // 1. Auth validation
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw createAppError('No authorization header', 'AUTH_ERROR');
    }

    const { data: { user }, error: authError } = await services.supabase.auth.getUser(authHeader);
    
    if (authError || !user) {
      console.error('[Gemini] Auth error:', { authError });
      throw createAppError('Invalid authorization', 'AUTH_ERROR');
    }

    console.log('[Gemini] Auth validated:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // 2. Get or create chat with validation
    const chat = await services.chat.getOrCreateChat(
      user.id, 
      chatId, 
      content.substring(0, 50)
    );

    if (!chat?.id) {
      console.error('[Gemini] Chat creation failed');
      throw createAppError('Failed to create or get chat', 'CHAT_ERROR');
    }

    console.log('[Gemini] Chat context established:', {
      chatId: chat.id,
      isNew: !chatId,
      timestamp: new Date().toISOString()
    });

    // 3. Initialize stream and send metadata
    const streamResponse = services.stream.getResponse(corsHeaders);
    await services.stream.writeMetadata({ 
      chatId: chat.id,
      status: 'created',
      timestamp: new Date().toISOString()
    });

    console.log('[Gemini] Metadata sent:', {
      chatId: chat.id,
      timestamp: new Date().toISOString()
    });

    // 4. Save user message
    const userMessage = await services.message.saveUserMessage(chat.id, content);
    console.log('[Gemini] User message saved:', {
      messageId: userMessage.id,
      timestamp: new Date().toISOString()
    });

    // 5. Create assistant message placeholder
    const assistantMessage = await services.message.saveAssistantMessage(chat.id);
    console.log('[Gemini] Assistant message created:', {
      messageId: assistantMessage.id,
      timestamp: new Date().toISOString()
    });

    // 6. Assemble context and process with OpenAI
    const context = await assembleContext(services.supabase, chat.id);
    console.log('[Gemini] Context assembled:', {
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

    // 7. Process with OpenAI and handle response
    services.openai.streamCompletion(messages, async (chunk: string) => {
      await services.stream.writeChunk(chunk);
    })
    .then(async (fullResponse) => {
      await services.message.updateMessageStatus(
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
      await services.stream.writeChunk(JSON.stringify({ error: errorResponse }));
      
      await services.message.updateMessageStatus(
        assistantMessage.id,
        'failed'
      );
    })
    .finally(async () => {
      await services.stream.close();
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