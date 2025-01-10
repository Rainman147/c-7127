import { useRef, useCallback } from 'react';
import { createAbortController, abortWithReason } from '@/utils/abortController';

export const useCleanupManager = () => {
  const cleanupFunctionsRef = useRef<Map<string, { cleanup: () => void; controller: AbortController }>>(new Map());
  
  const registerCleanup = useCallback((cleanup: () => void, reason: string) => {
    const id = Math.random().toString(36).substring(7);
    const controller = createAbortController(reason);
    
    cleanupFunctionsRef.current.set(id, { 
      cleanup,
      controller 
    });
    
    return () => {
      if (cleanupFunctionsRef.current.has(id)) {
        const item = cleanupFunctionsRef.current.get(id);
        if (item) {
          try {
            abortWithReason(item.controller, `Cleanup triggered for ${reason}`);
            item.cleanup();
          } catch (error) {
            console.error('[CleanupManager] Error during single cleanup:', error);
          }
        }
        cleanupFunctionsRef.current.delete(id);
      }
    };
  }, []);

  const clearQueuedOperations = useCallback((chatId?: string, reason?: string) => {
    const cleanupReason = reason || (chatId ? `Chat ${chatId} cleanup` : 'Unknown cleanup');
    console.log(`[CleanupManager] Clearing operations${chatId ? ` for chat ${chatId}` : ''}, reason: ${cleanupReason}`);
    
    cleanupFunctionsRef.current.forEach((item, id) => {
      try {
        abortWithReason(item.controller, cleanupReason);
        item.cleanup();
      } catch (error) {
        console.error('[CleanupManager] Error during cleanup:', error);
      }
      cleanupFunctionsRef.current.delete(id);
    });
  }, []);

  return {
    registerCleanup,
    clearQueuedOperations
  };
};