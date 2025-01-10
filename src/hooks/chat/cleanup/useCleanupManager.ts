import { useRef, useCallback, useEffect } from 'react';

interface ActiveOperation {
  controller: AbortController;
  cleanup?: () => void;
  startTime: number;
}

export const useCleanupManager = () => {
  const operationQueueRef = useRef<Map<string, ActiveOperation>>(new Map());
  const activeListenersRef = useRef<Set<() => void>>(new Set());
  const isUnmountingRef = useRef(false);

  const cleanupOperation = useCallback((chatId: string, reason: string) => {
    console.log('[useCleanupManager] Cleaning up operation for chat:', chatId, 'Reason:', reason);
    
    const operation = operationQueueRef.current.get(chatId);
    if (operation) {
      try {
        const duration = Date.now() - operation.startTime;
        operation.controller.abort(new Error(`Operation aborted: ${reason}`));
        if (operation.cleanup) {
          operation.cleanup();
        }
        operationQueueRef.current.delete(chatId);
        console.log(`[useCleanupManager] Successfully cleaned up operation for chat: ${chatId} after ${duration}ms`);
      } catch (error) {
        console.error('[useCleanupManager] Error during operation cleanup:', error);
      }
    }
  }, []);

  const clearQueuedOperations = useCallback((chatId?: string, reason: string = 'Manual cleanup') => {
    console.log('[useCleanupManager] Clearing operations', 
      chatId ? `for chat: ${chatId}` : 'for all chats',
      `Reason: ${reason}`
    );

    if (chatId) {
      cleanupOperation(chatId, reason);
    } else {
      const chatIds = Array.from(operationQueueRef.current.keys());
      chatIds.forEach(id => cleanupOperation(id, reason));
      operationQueueRef.current.clear();
    }

    console.log('[useCleanupManager] Operation queue state after cleanup:', {
      pendingOperations: operationQueueRef.current.size,
      activeListeners: activeListenersRef.current.size
    });
  }, [cleanupOperation]);

  const registerCleanup = useCallback((cleanup: () => void) => {
    activeListenersRef.current.add(cleanup);
    return () => {
      activeListenersRef.current.delete(cleanup);
    };
  }, []);

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      clearQueuedOperations(undefined, 'Component unmounting');
      activeListenersRef.current.clear();
    };
  }, [clearQueuedOperations]);

  return {
    cleanupOperation,
    clearQueuedOperations,
    registerCleanup,
    operationQueueRef,
    activeListenersRef,
    isUnmountingRef
  };
};