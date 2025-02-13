import { useRef, useCallback } from 'react';

interface BatchProcessorProps {
  onBatchReady: (batch: Blob) => void;
}

export const useBatchProcessor = ({ onBatchReady }: BatchProcessorProps) => {
  const chunks = useRef<Blob[]>([]);
  const lastChunkData = useRef<Float32Array | null>(null);
  const lastBatchTime = useRef<number>(0);
  
  // 5 seconds batch interval
  const BATCH_INTERVAL = 5000;
  // 2 seconds overlap between chunks
  const OVERLAP_DURATION = 2000;
  
  const processBatch = useCallback(() => {
    if (chunks.current.length > 0) {
      console.log(`Processing batch of ${chunks.current.length} chunks with overlap`);
      const batchBlob = new Blob(chunks.current, { type: 'audio/webm' });
      onBatchReady(batchBlob);
      
      // Keep the last chunk for overlap
      if (chunks.current.length > 0) {
        const lastChunk = chunks.current[chunks.current.length - 1];
        chunks.current = [lastChunk];
      } else {
        chunks.current = [];
      }
      
      lastBatchTime.current = Date.now();
    }
  }, [onBatchReady]);

  const addChunk = useCallback((chunk: Blob) => {
    chunks.current.push(chunk);
    const now = Date.now();
    
    // Process batch if enough time has passed
    if (now - lastBatchTime.current >= BATCH_INTERVAL) {
      processBatch();
    }
  }, [processBatch]);

  const clearChunks = useCallback(() => {
    chunks.current = [];
    lastChunkData.current = null;
  }, []);

  return {
    addChunk,
    processBatch,
    clearChunks
  };
};
