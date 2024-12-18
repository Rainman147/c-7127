import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 250; // Increased for better sentence completeness
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export const splitIntoChunks = (text: string): string[] => {
  console.log('[TTS-Chunking] Starting text chunking process');
  
  // Split by sentences while preserving punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  console.log('[TTS-Chunking] Number of sentences:', sentences.length);
  
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  console.log('[TTS-Chunking] Chunks created:', {
    numberOfChunks: chunks.length,
    averageLength: chunks.reduce((acc, chunk) => acc + chunk.length, 0) / chunks.length,
    chunkSizes: chunks.map(chunk => chunk.length)
  });

  return chunks;
};

export const processChunk = async (chunk: string, retryCount = 0): Promise<ArrayBuffer> => {
  try {
    console.log('[TTS-Processing] Processing chunk:', {
      length: chunk.length,
      retryCount,
      preview: chunk.substring(0, 50)
    });
    
    const startTime = performance.now();
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: chunk }
    });

    if (error) {
      console.error('[TTS-Processing] API error:', error);
      throw error;
    }

    if (!data?.audio) {
      console.error('[TTS-Processing] No audio data received');
      throw new Error('No audio data received from server');
    }

    try {
      // Convert base64 to ArrayBuffer in smaller chunks
      const base64 = data.audio;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const processingTime = performance.now() - startTime;
      console.log('[TTS-Processing] Chunk processed:', {
        processingTime: `${processingTime.toFixed(2)}ms`,
        outputSize: bytes.buffer.byteLength
      });
      
      return bytes.buffer;
    } catch (decodeError) {
      console.error('[TTS-Processing] Base64 decode error:', decodeError);
      throw new Error('Failed to decode audio data');
    }
  } catch (error) {
    console.error('[TTS-Processing] Error:', error);

    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[TTS-Processing] Retrying in ${delay}ms (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processChunk(chunk, retryCount + 1);
    }
    
    throw error;
  }
};