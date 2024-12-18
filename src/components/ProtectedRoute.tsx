import { FC, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession, clearSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateSession = async () => {
      const { session, error } = await checkSession();

      if (error) {
        if (error.isRefreshTokenError) {
          toast({
            title: "Session expired",
            description: "Please sign in again",
            variant: "destructive",
          });
          await clearSession();
        } else {
          toast({
            title: "Authentication Error",
            description: error.message || "Please sign in again",
            variant: "destructive",
          });
        }
        navigate('/auth');
        return;
      }

      if (!session) {
        console.log('No active session, redirecting to auth');
        navigate('/auth');
      }
    };

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT' || !session) {
        console.log('No session or signed out, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
};

export default ProtectedRoute;