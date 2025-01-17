import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkRateLimits(supabase: any, userId: string) {
  console.log('[checkRateLimits] Checking rate limits for user:', userId);

  // Get or create rate limit records for this user
  const types = ['requests_per_minute', 'daily_quota', 'concurrent'];
  for (const type of types) {
    const { data, error } = await supabase
      .from('rate_limits')
      .select()
      .eq('user_id', userId)
      .eq('limit_type', type)
      .single();

    if (!data) {
      await supabase
        .from('rate_limits')
        .insert({
          user_id: userId,
          limit_type: type,
          count: 0
        });
    }
  }

  // Check and update limits
  const limits = {
    'requests_per_minute': 30,
    'daily_quota': 1000,
    'concurrent': 3
  };

  // Check each limit type
  for (const [type, limit] of Object.entries(limits)) {
    const { data, error } = await supabase
      .from('rate_limits')
      .select('count, last_reset')
      .eq('user_id', userId)
      .eq('limit_type', type)
      .single();

    if (error) {
      console.error(`[checkRateLimits] Error checking ${type}:`, error);
      throw createAppError(`Error checking rate limits: ${error.message}`, 'RATE_LIMIT_ERROR');
    }

    if (data.count >= limit) {
      const timeUnit = type === 'requests_per_minute' ? 'minute' : 
                      type === 'daily_quota' ? 'day' : 'time';
      throw createAppError(
        `Rate limit exceeded: ${limit} requests per ${timeUnit}`, 
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Increment the counter
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('user_id', userId)
      .eq('limit_type', type);

    if (updateError) {
      console.error(`[checkRateLimits] Error updating ${type}:`, updateError);
      throw createAppError(`Error updating rate limits: ${updateError.message}`, 'RATE_LIMIT_ERROR');
    }
  }

  console.log('[checkRateLimits] Rate limits checked successfully');
}

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
    const messages = [
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

    // Process with OpenAI
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
      })
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.text();
        throw createAppError(
          `OpenAI API error: ${response.status} ${error}`,
          'AI_SERVICE_ERROR'
        );
      }

      const reader = response.body!.getReader();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  
                  // Update assistant message in real-time
                  const { error: updateError } = await supabase
                    .from('messages')
                    .update({ content: fullResponse })
                    .eq('id', assistantMessage.id);

                  if (updateError) {
                    console.error('Error updating message:', updateError);
                  }

                  // Send chunk to client
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }

        // Mark message as delivered
        const { error: finalUpdateError } = await supabase
          .from('messages')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('id', assistantMessage.id);

        if (finalUpdateError) {
          console.error('Error marking message as delivered:', finalUpdateError);
        }

        // Update chat timestamp
        const { error: chatUpdateError } = await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId);

        if (chatUpdateError) {
          console.error('Error updating chat timestamp:', chatUpdateError);
        }

        console.log('Processing completed successfully', {
          chatId,
          responseLength: fullResponse.length
        });

      } finally {
        await writer.close();
      }
    }).catch(async (error) => {
      console.error('Streaming error:', error);
      const errorResponse = handleError(error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorResponse })}\n\n`));
      await writer.close();

      // Update message status to failed
      const { error: updateError } = await supabase
        .from('messages')
        .update({ status: 'failed' })
        .eq('id', assistantMessage.id);

      if (updateError) {
        console.error('Error updating message status:', updateError);
      }
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
