import { useRef, useCallback } from 'react';

export const useCleanupManager = () => {
  const cleanupFunctionsRef = useRef<Map<string, () => void>>(new Map());
  
  const registerCleanup = useCallback((cleanup: () => void) => {
    const id = Math.random().toString(36).substring(7);
    cleanupFunctionsRef.current.set(id, cleanup);
    
    return () => {
      if (cleanupFunctionsRef.current.has(id)) {
        cleanupFunctionsRef.current.delete(id);
      }
    };
  }, []);

  const clearQueuedOperations = useCallback((chatId?: string, reason?: string) => {
    console.log(`[CleanupManager] Clearing operations${chatId ? ` for chat ${chatId}` : ''}, reason: ${reason || 'unknown'}`);
    
    cleanupFunctionsRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('[CleanupManager] Error during cleanup:', error);
      }
    });
    
    cleanupFunctionsRef.current.clear();
  }, []);

  return {
    registerCleanup,
    clearQueuedOperations
  };
};