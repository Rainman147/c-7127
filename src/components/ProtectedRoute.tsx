import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearSession } from '@/utils/auth/sessionManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSessionError = useCallback(async () => {
    console.log('[ProtectedRoute] Handling session error, redirecting to auth');
    if (!isRedirecting) {
      setIsRedirecting(true);
      await clearSession();
      navigate('/auth', { replace: true });
    }
  }, [navigate, isRedirecting]);

  const validateSession = useCallback(async () => {
    console.log('[ProtectedRoute] Starting session validation...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[ProtectedRoute] Session error:', sessionError);
        await handleSessionError();
        return false;
      }

      if (!session) {
        console.log('[ProtectedRoute] No active session found');
        await handleSessionError();
        return false;
      }

      // Check if token is close to expiry (within 5 minutes)
      const tokenExpiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = tokenExpiryTime.getTime() - now.getTime();
      
      if (timeUntilExpiry < 300000) {
        console.log('[ProtectedRoute] Token near expiry, attempting refresh');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('[ProtectedRoute] Token refresh failed:', refreshError);
          if (refreshError.message?.includes('session_not_found')) {
            console.log('[ProtectedRoute] Session not found during refresh, clearing session');
            await handleSessionError();
            return false;
          }
          
          toast({
            title: "Session Error",
            description: "There was a problem refreshing your session. Please sign in again.",
            variant: "destructive",
          });
          await handleSessionError();
          return false;
        }
        
        if (refreshData.session) {
          console.log('[ProtectedRoute] Token refreshed successfully');
        }
      }

      return true;
    } catch (error) {
      console.error('[ProtectedRoute] Critical validation error:', error);
      await handleSessionError();
      return false;
    }
  }, [navigate, toast, handleSessionError]);

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted');
    let mounted = true;
    
    const checkSession = async () => {
      if (!mounted) return;
      
      const isValid = await validateSession();
      if (!mounted) return;
      
      setIsValidating(false);
      
      if (!isValid) {
        console.log('[ProtectedRoute] Session invalid, redirecting to auth');
        return;
      }
      
      console.log('[ProtectedRoute] Session valid, rendering protected content');
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', event, 'Session exists:', !!session);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] No session, redirecting to auth');
        await handleSessionError();
      }
    });

    return () => {
      console.log('[ProtectedRoute] Cleaning up subscriptions');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, validateSession, handleSessionError]);

  if (isValidating) {
    console.log('[ProtectedRoute] Validating session...');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Validating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;