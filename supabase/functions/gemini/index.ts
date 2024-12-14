import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to Gemini function');
    const { prompt, audioData } = await req.json();
    
    if (!googleApiKey) {
      console.error('Google API key not found');
      throw new Error('Google API key not configured');
    }

    let endpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    let requestBody: any = {
      contents: [{
        parts: [{
          text: prompt || ''
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // If audio data is provided, use it for transcription
    if (audioData) {
      endpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:transcribeContent';
      requestBody = {
        audio: {
          data: audioData
        },
        config: {
          languageCode: "en-US"
        }
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Received response from Gemini API');
    const data = await response.json();
    console.log('Parsed response:', data);

    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    const generatedText = audioData 
      ? data.transcript 
      : data.candidates[0].content.parts[0].text;
    
    console.log('Generated text:', generatedText);

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});