import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../transcribe/utils/cors.ts";

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages array');
    }

    // Format messages for the model
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Add system message for title generation
    formattedMessages.unshift({
      role: 'user',
      parts: [{ text: 'Generate a concise title (max 50 characters) that summarizes the main topic or purpose of this conversation. Respond with just the title, no additional text.' }],
    });

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const title = data.candidates[0].content.parts[0].text.trim();

    return new Response(
      JSON.stringify({ title: title.substring(0, 50) }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error generating title:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});