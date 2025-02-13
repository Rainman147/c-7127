
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
      console.error('[direct-chat] Missing Authorization header');
      throw new Error('Missing Authorization header');
    }

    // Initialize Supabase client with minimal configuration
    console.log('[direct-chat] Initializing Supabase client');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { 
          headers: { Authorization: authHeader }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    // Get authenticated user with enhanced error logging
    console.log('[direct-chat] Verifying authentication');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError) {
      console.error('[direct-chat] Authentication error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      console.error('[direct-chat] No user found in session');
      throw new Error('No authenticated user found');
    }

    console.log('[direct-chat] Authentication successful for user:', user.id);

    // Parse request body
    const { chatId, content, type = 'text', metadata = {} } = await req.json();

    if (!chatId || !content) {
      console.error('[direct-chat] Missing required fields:', { chatId, content });
      throw new Error('Missing required fields');
    }

    console.log('[direct-chat] Processing message:', { chatId, type });

    // Insert user's message
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        type,
        role: 'user',
        metadata
      });

    if (messageError) {
      console.error('[direct-chat] Error inserting message:', messageError);
      throw messageError;
    }

    console.log('[direct-chat] User message inserted successfully');

    // Process with OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content }]
      })
    });

    if (!openAIResponse.ok) {
      console.error('[direct-chat] OpenAI API error:', openAIResponse.statusText);
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const completion = await openAIResponse.json();
    
    if (!completion?.choices?.[0]?.message?.content) {
      console.error('[direct-chat] Invalid OpenAI API response:', completion);
      throw new Error('Invalid OpenAI API response');
    }

    // Insert assistant's response
    const { error: responseError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chatId,
        role: 'assistant',
        content: completion.choices[0].message.content,
        type: 'text',
        metadata: { 
          sortIndex: (metadata?.sortIndex || 0) + 1 
        }
      });

    if (responseError) {
      console.error('[direct-chat] Error inserting assistant response:', responseError);
      throw responseError;
    }

    console.log('[direct-chat] Assistant response inserted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        chatId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('[direct-chat] Error:', error);
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

