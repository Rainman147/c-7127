import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 100; // characters
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export const splitIntoChunks = (text: string): string[] => {
  console.log('[TTS-Chunking] Starting text chunking process');
  console.log('[TTS-Chunking] Input text length:', text.length);
  
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

  console.log('[TTS-Chunking] Final chunks:', {
    numberOfChunks: chunks.length,
    averageChunkLength: chunks.reduce((acc, chunk) => acc + chunk.length, 0) / chunks.length,
    smallestChunk: Math.min(...chunks.map(c => c.length)),
    largestChunk: Math.max(...chunks.map(c => c.length))
  });

  return chunks;
};

export const processChunk = async (chunk: string, retryCount = 0): Promise<ArrayBuffer> => {
  try {
    console.log('[TTS-Processing] Processing chunk:', {
      chunkLength: chunk.length,
      retryCount,
      preview: chunk.substring(0, 50) + '...'
    });
    
    const startTime = performance.now();
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { text: chunk }
    });

    const processingTime = performance.now() - startTime;
    console.log('[TTS-Processing] API response time:', processingTime.toFixed(2), 'ms');

    if (error) {
      console.error('[TTS-Processing] API error:', {
        error,
        chunk: chunk.substring(0, 50) + '...',
        retryCount
      });
      throw error;
    }

    if (!data?.audio) {
      console.error('[TTS-Processing] No audio data received:', {
        dataReceived: !!data,
        hasAudioProperty: data ? 'audio' in data : false
      });
      throw new Error('No audio data received');
    }

    // Convert base64 to ArrayBuffer
    console.log('[TTS-Processing] Converting base64 to ArrayBuffer');
    const audioData = atob(data.audio);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioData.length; i++) {
      view[i] = audioData.charCodeAt(i);
    }
    
    console.log('[TTS-Processing] Chunk processed successfully:', {
      originalSize: chunk.length,
      audioSize: arrayBuffer.byteLength
    });
    
    return arrayBuffer;
  } catch (error) {
    console.error('[TTS-Processing] Error processing chunk:', {
      error,
      retryCount,
      maxRetries: MAX_RETRIES
    });

    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[TTS-Processing] Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processChunk(chunk, retryCount + 1);
    }
    throw error;
  }
};