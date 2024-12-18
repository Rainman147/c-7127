import { supabase } from '@/integrations/supabase/client';

const CHUNK_SIZE = 250; // Increased for better sentence completeness

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

export const processChunk = async (chunk: string): Promise<ArrayBuffer> => {
  try {
    console.log('[TTS-Processing] Processing chunk:', {
      length: chunk.length,
      preview: chunk.substring(0, 50)
    });
    
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

    // Convert base64 to ArrayBuffer
    const binaryString = atob(data.audio);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('[TTS-Processing] Successfully processed audio chunk');
    return bytes.buffer;
    
  } catch (error) {
    console.error('[TTS-Processing] Error:', error);
    throw error;
  }
};