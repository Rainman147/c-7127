import { secureLog, logError } from '../utils/logging.ts';
import { AudioPayload } from '../utils/validation.ts';

export const transcribeWithGemini = async (payload: AudioPayload) => {
  try {
    secureLog('Initiating Gemini transcription', {
      mimeType: payload.metadata.mimeType,
      streaming: payload.metadata.streaming,
      duration: payload.metadata.duration
    });

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:streamGenerateContent?key=' + 
      Deno.env.get('GOOGLE_API_KEY'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              inlineData: {
                mimeType: payload.metadata.mimeType,
                data: payload.audioData
              }
            }]
          }],
          tools: [{
            functionDeclarations: [{
              name: "transcribe",
              description: "Transcribes the given audio",
              parameters: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "The transcribed text"
                  }
                },
                required: ["text"]
              }
            }]
          }],
          generation_config: {
            temperature: 0,
            topP: 1,
            topK: 1,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      secureLog('Gemini API error', { 
        status: response.status,
        statusText: response.statusText,
        error: errorData 
      });
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    const result = await response.json();
    secureLog('Gemini transcription completed', { 
      success: true,
      hasTranscription: !!result.transcription 
    });

    return result;
  } catch (error) {
    logError(error as Error, { 
      stage: 'gemini_transcription',
      metadata: payload.metadata 
    });
    throw error;
  }
};