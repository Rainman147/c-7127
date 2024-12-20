import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    console.log('[ProtectedRoute] Validating session...');
    try {
      // First check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[ProtectedRoute] Session validation error:', sessionError);
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      if (!session) {
        console.log('[ProtectedRoute] No active session found');
        navigate('/auth');
        return;
      }

      // Check if token is close to expiry (within 5 minutes)
      const tokenExpiryTime = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = tokenExpiryTime.getTime() - now.getTime();
      
      if (timeUntilExpiry < 300000) { // 5 minutes in milliseconds
        console.log('[ProtectedRoute] Token near expiry, attempting refresh');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('[ProtectedRoute] Token refresh failed:', refreshError);
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
        
        if (refreshData.session) {
          console.log('[ProtectedRoute] Token refreshed successfully');
          toast({
            title: "Session Refreshed",
            description: "Your session has been renewed.",
          });
        }
      }

      // Verify the access token is still valid
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[ProtectedRoute] User validation error:', userError);
        if (userError.message?.includes('session_not_found') || userError.status === 403) {
          console.log('[ProtectedRoute] Token expired or invalid, redirecting to login');
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
      }

      if (!userData?.user) {
        console.log('[ProtectedRoute] No user data found, redirecting to login');
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      console.log('[ProtectedRoute] Session validated successfully');
    } catch (error) {
      console.error('[ProtectedRoute] Critical session validation error:', error);
      await supabase.auth.signOut();
      navigate('/auth');
    }
  }, [navigate, toast]);

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted');
    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', {
        event,
        sessionExists: !!session,
        timestamp: new Date().toISOString()
      });
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] User signed out or session expired, redirecting to auth');
        navigate('/auth');
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