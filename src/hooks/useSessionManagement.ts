import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  retryCount: number;
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
    console.log('[SessionManagement] Processing queued operation:', {
      operationId: currentOperation.id,
      retryCount: currentOperation.retryCount,
      queueLength: operationQueue.length
    });

    try {
      await currentOperation.operation();
      setOperationQueue(queue => queue.slice(1));
      console.log('[SessionManagement] Operation completed successfully:', currentOperation.id);
    } catch (error) {
      console.error('[SessionManagement] Operation failed:', {
        operationId: currentOperation.id,
        error,
        retryCount: currentOperation.retryCount
      });

      if (currentOperation.retryCount < 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, currentOperation.retryCount) * 1000;
        console.log(`[SessionManagement] Retrying operation in ${delay}ms`);
        
        setTimeout(() => {
          setOperationQueue(queue => [
            { ...currentOperation, retryCount: currentOperation.retryCount + 1 },
            ...queue.slice(1)
          ]);
        }, delay);
      } else {
        console.error('[SessionManagement] Operation failed after max retries:', currentOperation.id);
        setOperationQueue(queue => queue.slice(1));
        toast({
          title: "Operation Failed",
          description: "Please try again or refresh the page",
          variant: "destructive",
        });
      }
    }
  }, [operationQueue, toast]);

  const queueOperation = useCallback((operation: () => Promise<any>) => {
    const operationId = crypto.randomUUID();
    console.log('[SessionManagement] Queueing new operation:', operationId);
    
    setOperationQueue(queue => [...queue, {
      id: operationId,
      operation,
      retryCount: 0
    }]);

    return operationId;
  }, []);

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
    console.log('[SessionManagement] Auth state changed:', {
      event,
      timestamp: new Date().toISOString()
    });
    
    if (event === 'SIGNED_OUT' || !currentSession) {
      console.log('[SessionManagement] User signed out or session expired');
      setSession(null);
      navigate('/auth');
      return;
    }

    if (event === 'TOKEN_REFRESHED') {
      console.log('[SessionManagement] Token refreshed, updating session');
      setSession(currentSession);
    }
  }, [navigate]);

  useEffect(() => {
    console.log('[SessionManagement] Initializing session management');
    let isSubscribed = true;

    const initializeSession = async () => {
      try {
        setIsValidating(true);
        const validSession = await validateSession();

        if (!isSubscribed) return;

        if (!validSession) {
          console.log('[SessionManagement] No valid session, redirecting to auth');
          navigate('/auth');
          return;
        }

        setSession(validSession);
      } catch (error: any) {
        console.error('[SessionManagement] Session initialization error:', error);
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
      console.log('[SessionManagement] Cleaning up session management');
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [validateSession, handleAuthStateChange, navigate, toast]);

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
    queueOperation
  };
};