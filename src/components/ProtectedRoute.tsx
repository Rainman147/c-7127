import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);

  const validateSession = useCallback(async () => {
    console.log('[ProtectedRoute] Starting session validation...');
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[ProtectedRoute] Session error:', sessionError);
        await supabase.auth.signOut();
        navigate('/auth');
        return false;
      }

      if (!session) {
        console.log('[ProtectedRoute] No active session found');
        navigate('/auth');
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
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          navigate('/auth');
          return false;
        }
        
        if (refreshData.session) {
          console.log('[ProtectedRoute] Token refreshed successfully');
        }
      }

      return true;
    } catch (error) {
      console.error('[ProtectedRoute] Critical validation error:', error);
      await supabase.auth.signOut();
      navigate('/auth');
      return false;
    }
  }, [navigate, toast]);

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted');
    
    const checkSession = async () => {
      const isValid = await validateSession();
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', event, 'Session exists:', !!session);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] No session, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      console.log('[ProtectedRoute] Cleaning up subscriptions');
      subscription.unsubscribe();
    };
  }, [navigate, validateSession]);

  if (isValidating) {
    console.log('[ProtectedRoute] Validating session...');
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};

export default ProtectedRoute;