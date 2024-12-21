import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    console.log('[ProtectedRoute] Validating session...');
    const { session, error } = await checkSession();

    if (error) {
      console.log('[ProtectedRoute] Session validation failed:', {
        error: error.message,
        isRefreshTokenError: error.isRefreshTokenError,
        timestamp: new Date().toISOString()
      });
      
      // Only show toast for non-refresh token errors
      if (!error.isRefreshTokenError) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      }
      
      navigate('/auth');
      return;
    }

    if (!session) {
      console.log('[ProtectedRoute] No active session found');
      navigate('/auth');
      return;
    }

    console.log('[ProtectedRoute] Session validated successfully');
  }, [navigate, toast]);

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted');
    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', {
        event,
        sessionExists: !!session,
        timestamp: new Date().toISOString()
      });
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] User signed out or session expired, redirecting to auth');
        navigate('/auth');
      } else if (event === 'SIGNED_IN') {
        // Wait a moment for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 100));
        validateSession();
      }
    });

    return () => {
      console.log('[ProtectedRoute] Cleaning up protected route subscription');
      subscription.unsubscribe();
    };
  }, [navigate, validateSession]);

  return <>{children}</>;
};

export default ProtectedRoute;