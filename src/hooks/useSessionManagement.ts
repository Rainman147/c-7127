import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  retryCount: number;
  startTime?: number;
  type: 'auth' | 'data' | 'cleanup';
}

export const useSessionManagement = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [operationQueue, setOperationQueue] = useState<QueuedOperation[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const processQueue = useCallback(async () => {
    if (operationQueue.length === 0) return;

    const currentOperation = operationQueue[0];
    const startTime = performance.now();
    currentOperation.startTime = startTime;

    console.log('[SessionManagement] Processing queued operation:', {
      operationId: currentOperation.id,
      type: currentOperation.type,
      retryCount: currentOperation.retryCount,
      queueLength: operationQueue.length,
      startTime: new Date().toISOString(),
      queuedAt: currentOperation.startTime ? 
        `${(startTime - currentOperation.startTime).toFixed(2)}ms ago` : 'unknown'
    });

    try {
      await currentOperation.operation();
      const endTime = performance.now();
      console.log('[SessionManagement] Operation completed successfully:', {
        operationId: currentOperation.id,
        type: currentOperation.type,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        remainingQueue: operationQueue.length - 1
      });
      setOperationQueue(queue => queue.slice(1));
    } catch (error) {
      console.error('[SessionManagement] Operation failed:', {
        operationId: currentOperation.id,
        type: currentOperation.type,
        error,
        retryCount: currentOperation.retryCount,
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });

      if (currentOperation.retryCount < 3) {
        const delay = Math.pow(2, currentOperation.retryCount) * 1000;
        console.log(`[SessionManagement] Retrying operation in ${delay}ms`, {
          operationId: currentOperation.id,
          attempt: currentOperation.retryCount + 1,
          maxAttempts: 3
        });
        
        setTimeout(() => {
          setOperationQueue(queue => [
            { ...currentOperation, retryCount: currentOperation.retryCount + 1 },
            ...queue.slice(1)
          ]);
        }, delay);
      } else {
        console.error('[SessionManagement] Operation failed after max retries:', {
          operationId: currentOperation.id,
          type: currentOperation.type,
          totalDuration: `${(performance.now() - (currentOperation.startTime || startTime)).toFixed(2)}ms`
        });
        setOperationQueue(queue => queue.slice(1));
        toast({
          title: "Operation Failed",
          description: "Please try again or refresh the page",
          variant: "destructive",
        });
      }
    }
  }, [operationQueue, toast]);

  const validateSession = useCallback(async () => {
    const startTime = performance.now();
    try {
      console.log('[SessionManagement] Validating session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[SessionManagement] Session validation error:', {
          error,
          timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        throw error;
      }

      if (!currentSession) {
        console.log('[SessionManagement] No active session found', {
          timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        return null;
      }

      console.log('[SessionManagement] Session validated successfully', {
        timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return currentSession;
    } catch (error: any) {
      console.error('[SessionManagement] Session validation failed:', error);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const startTime = performance.now();
    try {
      console.log('[SessionManagement] Attempting to refresh session...');
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[SessionManagement] Session refresh failed:', {
          error,
          timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        throw error;
      }

      if (!refreshedSession) {
        console.log('[SessionManagement] No session after refresh', {
          timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
        });
        return null;
      }

      console.log('[SessionManagement] Session refreshed successfully', {
        timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      return refreshedSession;
    } catch (error: any) {
      console.error('[SessionManagement] Session refresh error:', error);
      return null;
    }
  }, []);

  const handleAuthStateChange = useCallback(async (event: string, currentSession: Session | null) => {
    const startTime = performance.now();
    console.log('[SessionManagement] Auth state changed:', {
      event,
      timestamp: new Date().toISOString(),
      hasSession: !!currentSession
    });
    
    if (event === 'SIGNED_OUT' || !currentSession) {
      console.log('[SessionManagement] Cleaning up session state:', {
        event,
        queueLength: operationQueue.length,
        timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      setSession(null);
      setOperationQueue([]);
      navigate('/auth');
      return;
    }

    if (event === 'TOKEN_REFRESHED') {
      console.log('[SessionManagement] Token refreshed:', {
        timestamp: new Date().toISOString(),
        timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      setSession(currentSession);
    }
  }, [navigate, operationQueue.length]);

  useEffect(() => {
    console.log('[SessionManagement] Initializing session management');
    let isSubscribed = true;
    const initStartTime = performance.now();

    const initializeSession = async () => {
      try {
        setIsValidating(true);
        const validSession = await validateSession();

        if (!isSubscribed) {
          console.log('[SessionManagement] Cleanup: Component unmounted during initialization', {
            timeElapsed: `${(performance.now() - initStartTime).toFixed(2)}ms`
          });
          return;
        }

        if (!validSession) {
          console.log('[SessionManagement] No valid session, redirecting to auth', {
            timeElapsed: `${(performance.now() - initStartTime).toFixed(2)}ms`
          });
          navigate('/auth');
          return;
        }

        setSession(validSession);
      } catch (error: any) {
        console.error('[SessionManagement] Session initialization error:', {
          error,
          timeElapsed: `${(performance.now() - initStartTime).toFixed(2)}ms`
        });
        toast({
          title: "Authentication Error",
          description: error.message || "Please sign in again",
          variant: "destructive",
        });
        navigate('/auth');
      } finally {
        if (isSubscribed) {
          setIsValidating(false);
        }
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      const cleanupStartTime = performance.now();
      console.log('[SessionManagement] Starting cleanup:', {
        queueLength: operationQueue.length,
        isValidating,
        hasSession: !!session
      });

      isSubscribed = false;
      subscription.unsubscribe();

      if (operationQueue.length > 0) {
        console.log('[SessionManagement] Cleaning up pending operations:', {
          pendingOperations: operationQueue.map(op => ({
            id: op.id,
            type: op.type,
            retryCount: op.retryCount
          }))
        });
      }

      console.log('[SessionManagement] Cleanup completed:', {
        duration: `${(performance.now() - cleanupStartTime).toFixed(2)}ms`,
        totalSessionDuration: `${(performance.now() - initStartTime).toFixed(2)}ms`
      });
    };
  }, [validateSession, handleAuthStateChange, navigate, toast, operationQueue, session, isValidating]);

  // Process queue when it changes
  useEffect(() => {
    if (operationQueue.length > 0 && !isValidating) {
      processQueue();
    }
  }, [operationQueue, isValidating, processQueue]);

  return {
    session,
    isValidating,
    validateSession,
    refreshSession,
    queueOperation: useCallback((operation: () => Promise<any>, type: 'auth' | 'data' | 'cleanup' = 'data') => {
      const operationId = crypto.randomUUID();
      console.log('[SessionManagement] Queueing new operation:', {
        id: operationId,
        type,
        queueLength: operationQueue.length + 1,
        timestamp: new Date().toISOString()
      });
      
      setOperationQueue(queue => [...queue, {
        id: operationId,
        operation,
        retryCount: 0,
        type,
        startTime: performance.now()
      }]);

      return operationId;
    }, [operationQueue.length])
  };
};
