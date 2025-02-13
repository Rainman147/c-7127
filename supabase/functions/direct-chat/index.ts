
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Parse request body
    const { tempId, title, message } = await req.json();

    if (!tempId || !title || !message) {
      throw new Error('Missing required fields');
    }

    // Begin transaction
    const { data: chatData, error: chatError } = await supabaseClient
      .rpc('create_chat_with_message', {
        p_user_id: user.id,
        p_title: title,
        p_content: message.content,
        p_role: message.role,
        p_type: message.type || 'text',
        p_metadata: message.metadata || {}
      });

    if (chatError) {
      throw chatError;
    }

    // Process the message with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'o1-mini',
        messages: [{ role: 'user', content: message.content }]
      })
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const completion = await openAIResponse.json();
    
    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI API response');
    }

    // Insert assistant's response
    const { error: responseError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatData.chat_id,
        role: 'assistant',
        content: completion.choices[0].message.content,
        type: 'text',
        metadata: { sortIndex: (message.metadata?.sortIndex || 0) + 1 }
      });

    if (responseError) {
      throw responseError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        chatId: chatData.chat_id,
        tempId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: error.message?.includes('Authentication') ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
