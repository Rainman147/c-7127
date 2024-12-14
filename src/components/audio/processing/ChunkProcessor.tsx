import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChunkProcessorProps {
  onChunkProcessed: (transcription: string) => void;
  onError: (error: Error) => void;
}

export const processChunk = async (chunk: Blob): Promise<string> => {
  try {
    console.log('Processing chunk with overlap handling:', { 
      size: chunk.size, 
      type: chunk.type 
    });
    
    // Convert chunk to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(chunk);
    const base64Data = await base64Promise;
    
    console.log('Chunk converted to base64 with overlap, length:', base64Data.length);

    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: { 
        audioData: base64Data,
        mimeType: chunk.type,
        withOverlap: true // Signal to the backend that this chunk has overlap
      }
    });

    if (error) {
      console.error('Transcription error:', error);
      throw new Error(error.message || 'Failed to transcribe audio chunk');
    }

    if (!data?.transcription) {
      throw new Error('No transcription received for chunk');
    }

    return data.transcription;
  } catch (error: any) {
    console.error('Chunk processing error:', error);
    throw error;
  }
};

export const useChunkProcessor = ({ onChunkProcessed, onError }: ChunkProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [previousTranscription, setPreviousTranscription] = useState('');

  const processChunks = async (chunks: Blob[]) => {
    setIsProcessing(true);
    setTotalChunks(chunks.length);
    
    try {
      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);
        const transcription = await processChunk(chunks[i]);
        
        // Remove potential duplicate phrases from overlap
        const cleanedTranscription = removeDuplicateOverlap(previousTranscription, transcription);
        onChunkProcessed(cleanedTranscription);
        setPreviousTranscription(transcription);
      }
    } catch (error: any) {
      onError(error);
    } finally {
      setIsProcessing(false);
      setCurrentChunk(0);
      setTotalChunks(0);
      setPreviousTranscription('');
    }
  };

  // Helper function to remove duplicate phrases from overlap
  const removeDuplicateOverlap = (previous: string, current: string): string => {
    if (!previous) return current;
    
    // Split into words and find potential overlapping phrases
    const previousWords = previous.split(' ');
    const currentWords = current.split(' ');
    
    // Look for overlapping phrases (3-5 words)
    for (let phraseLength = 5; phraseLength >= 3; phraseLength--) {
      if (previousWords.length < phraseLength) continue;
      
      const lastPhrase = previousWords.slice(-phraseLength).join(' ');
      const currentText = current.toLowerCase();
      
      if (currentText.startsWith(lastPhrase.toLowerCase())) {
        // Remove the overlapping phrase from the current transcription
        return current.slice(lastPhrase.length).trim();
      }
    }
    
    return current;
  };

  return {
    processChunks,
    isProcessing,
    currentChunk,
    totalChunks
  };
};