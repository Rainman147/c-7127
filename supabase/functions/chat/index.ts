import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, systemInstructions } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is required')
    }

    console.log('Processing chat request:', {
      messageCount: messages.length,
      hasSystemInstructions: !!systemInstructions
    });

    // Prepare messages array with system instructions if provided
    const messageArray = []
    if (systemInstructions) {
      messageArray.push({
        role: 'system',
        content: systemInstructions
      })
    }

    // Add user messages
    messageArray.push(...messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })))

    console.log('Sending request to OpenAI:', {
      messageCount: messageArray.length,
      model: 'gpt-4o-mini'
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messageArray,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', {
        status: response.status,
        error: error.error?.message || 'Unknown error',
        type: error.error?.type
      });
      throw new Error(error.error?.message || 'Error calling OpenAI API')
    }

    const data = await response.json()
    console.log('Received response from OpenAI:', {
      status: response.status,
      choicesCount: data.choices?.length
    });

    const content = data.choices[0].message.content

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chat function:', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})