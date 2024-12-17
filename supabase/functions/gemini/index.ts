import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to OpenAI function');
    const { messages, systemInstructions } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format');
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    // Prepare messages array for OpenAI
    const openAiMessages = [
      // Add system instructions if provided
      ...(systemInstructions ? [{
        role: 'system',
        content: systemInstructions
      }] : []),
      // Add conversation messages
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    console.log('Sending request to OpenAI with system instructions:', systemInstructions);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview", // Using the correct model ID for gpt-4o-mini
        messages: openAiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return new Response(
      JSON.stringify({ content }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in OpenAI function:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});