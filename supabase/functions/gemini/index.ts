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
    console.log('Received request to Gemini function for audio transcription');
    const { audioData } = await req.json();
    
    if (!googleApiKey) {
      console.error('Google API key not found');
      throw new Error('Google API key not configured');
    }

    // Configure the transcription request with speaker diarization and noise reduction
    const requestBody = {
      audio: {
        content: audioData
      },
      config: {
        languageCode: "en-US",
        model: "gemini-pro",
        enableAutomaticPunctuation: true,
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 2, // For patient-physician interactions
        useEnhanced: true, // Enable noise reduction
        metadata: {
          interactionType: "DISCUSSION",
          industryNaicsCodeOfAudio: "621111", // NAICS code for physician offices
          originalMediaType: "AUDIO"
        }
      }
    };

    console.log('Sending audio data to Gemini API');
    const response = await fetch('https://generativelanguage.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': googleApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', error);
      throw new Error(error.error?.message || 'Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Received transcription from Gemini API');

    // Process the transcription results with speaker diarization
    const transcription = data.results.map((result: any) => {
      const words = result.alternatives[0].words || [];
      let currentSpeaker = null;
      let currentText = '';
      const segments = [];

      words.forEach((word: any) => {
        if (word.speakerTag !== currentSpeaker) {
          if (currentText) {
            segments.push({
              speaker: currentSpeaker === 1 ? 'Physician' : 'Patient',
              text: currentText.trim()
            });
          }
          currentSpeaker = word.speakerTag;
          currentText = word.word;
        } else {
          currentText += ' ' + word.word;
        }
      });

      if (currentText) {
        segments.push({
          speaker: currentSpeaker === 1 ? 'Physician' : 'Patient',
          text: currentText.trim()
        });
      }

      return segments;
    }).flat();

    return new Response(JSON.stringify({ transcription }), {
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