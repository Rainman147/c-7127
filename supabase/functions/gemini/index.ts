import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { assembleContext } from "./utils/contextAssembler.ts";
import { handleError, createAppError } from "./utils/errorHandler.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      'VALIDATION_ERROR'
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save user message
    const { data: userMessage, error: saveError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        sender: 'user',
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
        throw createAppError(
          `OpenAI API error: ${response.status}`,
          'AI_ERROR'
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
                  
                  // Update assistant message
                  const { error: updateError } = await supabase
                    .from('messages')
                    .update({ content: fullResponse })
                    .eq('id', assistantMessage.id);

                  if (updateError) {
                    console.error('Error updating message:', updateError);
                  }

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