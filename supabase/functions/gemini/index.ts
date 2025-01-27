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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize services
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw createAppError('OpenAI API key not configured', 'VALIDATION_ERROR');
  }

  try {
    // Parse request
    const { content, chatId } = await req.json();
    
    if (!content?.trim()) {
      throw createAppError('Message content is required', 'VALIDATION_ERROR');
    }

    console.log('Processing message:', {
      hasContent: !!content,
      chatId
    });

    // Initialize services
    const supabase = createClient(supabaseUrl, supabaseKey);
    const chatService = new ChatService(supabaseUrl, supabaseKey);
    const messageService = new MessageService(supabaseUrl, supabaseKey);
    const openaiService = new OpenAIService(apiKey);
    const streamHandler = new StreamHandler();

    // Validate user authentication
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw createAppError('No authorization header', 'VALIDATION_ERROR');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw createAppError('Invalid authorization', 'VALIDATION_ERROR');
    }

    // Get or create chat session
    const chat = await chatService.getOrCreateChat(user.id, chatId, content.substring(0, 50));
    console.log('Chat context:', chat);

    // Save user message
    const userMessage = await messageService.saveUserMessage(chat.id, content);
    console.log('Saved user message:', userMessage);

    // Create initial assistant message placeholder
    const assistantMessage = await messageService.saveAssistantMessage(chat.id);
    console.log('Created assistant message:', assistantMessage);

    // Assemble context in parallel with message operations
    const context = await assembleContext(supabase, chat.id);
    console.log('Assembled context:', {
      hasTemplateInstructions: !!context.systemInstructions,
      hasPatientContext: !!context.patientContext,
      messageHistoryCount: context.messageHistory.length
    });

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: context.systemInstructions },
      ...context.messageHistory,
      { role: 'user', content }
    ];

    // Add patient context if available
    if (context.patientContext) {
      messages.unshift({ 
        role: 'system', 
        content: `Patient Context:\n${context.patientContext}`
      });
    }

    // Set up streaming response
    const streamResponse = streamHandler.getResponse(corsHeaders);
    const writer = streamHandler.getWriter();

    // Process with OpenAI and handle response
    openaiService.streamCompletion(messages, writer)
      .then(async (fullResponse) => {
        await messageService.updateMessageStatus(
          assistantMessage.id,
          'delivered',
          fullResponse
        );
        
        console.log('Processing completed successfully', {
          chatId: chat.id,
          responseLength: fullResponse.length
        });
      })
      .catch(async (error) => {
        console.error('Streaming error:', error);
        const errorResponse = handleError(error);
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorResponse })}\n\n`));
        
        await messageService.updateMessageStatus(
          assistantMessage.id,
          'failed'
        );
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