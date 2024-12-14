import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleApiKey = Deno.env.get('GOOGLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Medical vocabulary for improved transcription accuracy
const medicalVocabulary = [
  "hypertension", "myocardial infarction", "tachycardia", "dyspnea",
  "COPD", "DVT", "CBC", "BMP", "EKG", "MRI", "CT", "SpO2",
  // Common medications
  "metoprolol", "lisinopril", "atorvastatin", "omeprazole",
  // Common phrases
  "chief complaint", "history of present illness", "review of systems",
  "past medical history", "social history", "family history",
  // Vital signs
  "blood pressure", "heart rate", "respiratory rate", "temperature"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to Gemini function for audio transcription');
    const { audioData, language = "en-US" } = await req.json();
    
    if (!googleApiKey) {
      console.error('Google API key not found');
      throw new Error('Google API key not configured');
    }

    // Configure the transcription request with enhanced features
    const requestBody = {
      audio: {
        content: audioData
      },
      config: {
        languageCode: language,
        model: "gemini-pro",
        enableAutomaticPunctuation: true,
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 2, // For patient-physician interactions
        useEnhanced: true, // Enable noise reduction
        enableWordTimeOffsets: true, // Add timestamps for each word
        enableWordConfidence: true, // Get confidence scores for transcribed words
        speechContexts: [{
          phrases: medicalVocabulary,
          boost: 15 // Increase likelihood of recognizing medical terms
        }],
        metadata: {
          interactionType: "MEDICAL_DICTATION",
          industryNaicsCodeOfAudio: "621111", // NAICS code for physician offices
          originalMediaType: "AUDIO",
          recordingDeviceType: "SMARTPHONE",
          recordingDeviceName: "Clinical Voice Recorder",
          microphoneDistance: "NEARFIELD",
          originalMimeType: "audio/webm",
        },
        // Additional settings for clinical environment
        encoding: "WEBM_OPUS",
        sampleRateHertz: 16000,
        audioChannelCount: 1,
        profanityFilter: false, // Important for medical terms that might be flagged
        enableSpokenPunctuation: true,
        enableSpokenEmojis: false,
      }
    };

    console.log('Sending audio data to Gemini API with enhanced configuration');
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
    console.log('Received enhanced transcription from Gemini API');

    // Process the transcription results with speaker diarization and timestamps
    const transcription = data.results.map((result: any) => {
      const words = result.alternatives[0].words || [];
      let currentSpeaker = null;
      let currentText = '';
      let currentSegmentStart = null;
      const segments = [];

      words.forEach((word: any) => {
        const startTime = word.startTime || {};
        const endTime = word.endTime || {};
        const timestamp = `${startTime.seconds || 0}.${startTime.nanos ? startTime.nanos / 1000000 : 0}`;

        if (word.speakerTag !== currentSpeaker || !currentSegmentStart) {
          if (currentText) {
            segments.push({
              speaker: currentSpeaker === 1 ? 'Physician' : 'Patient',
              text: currentText.trim(),
              startTime: currentSegmentStart,
              endTime: timestamp,
              confidence: word.confidence
            });
          }
          currentSpeaker = word.speakerTag;
          currentText = word.word;
          currentSegmentStart = timestamp;
        } else {
          currentText += ' ' + word.word;
        }
      });

      if (currentText) {
        segments.push({
          speaker: currentSpeaker === 1 ? 'Physician' : 'Patient',
          text: currentText.trim(),
          startTime: currentSegmentStart,
          endTime: words[words.length - 1]?.endTime || currentSegmentStart,
          confidence: words[words.length - 1]?.confidence
        });
      }

      return segments;
    }).flat();

    return new Response(JSON.stringify({ 
      transcription,
      metadata: {
        languageCode: language,
        totalDuration: data.totalBilledTime,
        speakerCount: data.speakerCount || 2
      }
    }), {
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