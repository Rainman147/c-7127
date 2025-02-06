import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[Gemini] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    time: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    console.log('[Gemini] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    console.log('[Gemini] Request data:', {
      contentLength: requestData.content?.length,
      chatId: requestData.chatId,
      timestamp: new Date().toISOString()
    });

    // Initialize services
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('[Gemini] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenAIKey: !!openaiKey,
      time: new Date().toISOString()
    });

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    // Get token from Authorization header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    console.log('[Gemini] Auth header:', {
      hasAuthHeader: !!authHeader,
      headerLength: authHeader?.length,
      time: new Date().toISOString()
    });

    if (!authHeader) {
      console.error('[Gemini] No authorization header');
      throw new Error('No authorization header');
    }

    // Create new chat if needed
    const chatData = {
      user_id: requestData.userId,
      title: requestData.content.substring(0, 50),
    };

    // Make direct OpenAI call
    console.log('[Gemini] Making OpenAI API call');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: requestData.content }
        ],
        stream: false
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('[Gemini] OpenAI response received');

    const assistantContent = openAIData.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true,
        chatId: requestData.chatId || crypto.randomUUID(),
        isNewChat: !requestData.chatId,
        content: assistantContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Gemini] Function error:', {
      error,
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        retryable: false
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});