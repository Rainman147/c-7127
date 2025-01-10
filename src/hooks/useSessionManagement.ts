import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export const useSessionManagement = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateSession = useCallback(async () => {
    try {
      console.log('[SessionManagement] Validating session...');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[SessionManagement] Session validation error:', error);
        throw error;
      }

      if (!currentSession) {
        console.log('[SessionManagement] No active session found');
        return null;
      }

      console.log('[SessionManagement] Session validated successfully');
      return currentSession;
    } catch (error: any) {
      console.error('[SessionManagement] Session validation failed:', error);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      console.log('[SessionManagement] Attempting to refresh session...');
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[SessionManagement] Session refresh failed:', error);
        throw error;
      }

      if (!refreshedSession) {
        console.log('[SessionManagement] No session after refresh');
        return null;
      }

      console.log('[SessionManagement] Session refreshed successfully');
      return refreshedSession;
    } catch (error: any) {
      console.error('[SessionManagement] Session refresh error:', error);
      return null;
    }
  }, []);

  const handleAuthStateChange = useCallback(async (event: string, currentSession: Session | null) => {
    console.log('[SessionManagement] Auth state changed:', event);
    
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

  return {
    session,
    isValidating,
    validateSession,
    refreshSession
  };
};