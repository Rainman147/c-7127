import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimits } from "./utils/rateLimiter.ts";
import { processWithOpenAI, updateMessageStatus } from "./utils/messageProcessor.ts";
import { handleStreamingResponse } from "./utils/streamHandler.ts";

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
    throw createAppError(
      'OpenAI API key not configured',
      'AUTHENTICATION_ERROR'
    );
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

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('user_id')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      throw createAppError('Chat not found', 'NOT_FOUND_ERROR');
    }

    // Check rate limits before processing
    await checkRateLimits(supabase, chat.user_id);

    // Get next sequence number
    const { data: messages, error: seqError } = await supabase
      .from('messages')
      .select('sequence')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: false })
      .limit(1);

    if (seqError) {
      throw createAppError(
        'Error getting message sequence',
        'DATABASE_ERROR',
        seqError
      );
    }

    const sequence = (messages?.[0]?.sequence || 0) + 1;
    console.log(`Using sequence number: ${sequence}`);

    // Save user message
    const { data: userMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: 'user',
        sequence,
        type,
        status: 'delivered'
      })
      .select()
      .single();

    if (saveError) {
      throw createAppError(
        'Error saving user message',
        'DATABASE_ERROR',
        saveError
      );
    }

    // Assemble context
    const context = await assembleContext(supabase, chatId);
    console.log('Context assembled:', {
      hasTemplateInstructions: !!context.templateInstructions,
      hasPatientContext: !!context.patientContext,
      messageCount: context.messageHistory.length
    });

    // Prepare messages array
    const messageArray = [
      ...(context.templateInstructions ? [{
        role: 'system',
        content: context.templateInstructions
      }] : []),
      ...(context.patientContext ? [{
        role: 'system',
        content: context.patientContext
      }] : []),
      ...context.messageHistory,
      { role: 'user', content, type }
    ];

    // Create transform stream for streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Save initial assistant message
    const { data: assistantMessage, error: assistantError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content: '',
        sender: 'assistant',
        sequence: sequence + 1,
        type: 'text',
        status: 'processing'
      })
      .select()
      .single();

    if (assistantError) {
      throw createAppError(
        'Error creating assistant message',
        'DATABASE_ERROR',
        assistantError
      );
    }

    // Start streaming response
    const streamResponse = new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

    // Process with OpenAI and handle streaming
    processWithOpenAI(messageArray, apiKey)
      .then(async (response) => {
        await handleStreamingResponse(
          response,
          supabase,
          assistantMessage.id,
          chatId,
          writer,
          encoder
        );
      })
      .catch(async (error) => {
        console.error('Streaming error:', error);
        const errorResponse = handleError(error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorResponse })}\n\n`));
        await writer.close();

        // Update message status to failed
        await updateMessageStatus(supabase, assistantMessage.id, 'failed');
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