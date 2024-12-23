import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    console.log('[ProtectedRoute] Validating session...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[ProtectedRoute] No active session found');
        navigate('/auth');
        return;
      }

      // Only validate if we have a session
      const { error } = await checkSession();
      if (error) {
        console.log('[ProtectedRoute] Session validation failed:', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        if (!error.isRefreshTokenError) {
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
        }
        
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      console.log('[ProtectedRoute] Session validated successfully');
    } catch (error) {
      console.error('[ProtectedRoute] Unexpected error during session validation:', error);
      navigate('/auth');
    }
  }, [navigate, toast]);

  useEffect(() => {
    console.log('[ProtectedRoute] Setting up auth state listener');
    
    let isInitialCheck = true;
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', {
        event,
        sessionExists: !!session,
        timestamp: new Date().toISOString()
      });

      // Skip validation on initial mount to prevent double-checking
      if (isInitialCheck) {
        isInitialCheck = false;
        return;
      }

      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] User signed out or session expired, redirecting to auth');
        navigate('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[ProtectedRoute] Token refreshed successfully');
      }
    });

    // Initial session check
    validateSession();

    return () => {
      console.log('[ProtectedRoute] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [validateSession, navigate]);

  return <>{children}</>;
};

export default ProtectedRoute;