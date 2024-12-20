import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateSession = async () => {
      try {
        console.log('Validating session...');
        const { session, error } = await checkSession();

        if (error) {
          console.error('Session validation failed:', {
            error: error.message,
            isRefreshTokenError: error.isRefreshTokenError
          });
          
          // Only show toast for non-refresh token errors
          if (!error.isRefreshTokenError) {
            toast({
              title: "Authentication Error",
              description: "Please sign in again to continue",
              variant: "destructive",
            });
          }
          
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No active session found, redirecting to auth');
          navigate('/auth');
          return;
        }

        console.log('Session validated successfully');
      } catch (error: any) {
        console.error('Unexpected error during session validation:', error);
        toast({
          title: "Connection Error",
          description: "Unable to verify your session. Please check your connection and try again.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, sessionExists: !!session });
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session expired, redirecting to auth');
        navigate('/auth');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      console.log('Cleaning up auth subscriptions');
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
};

export default ProtectedRoute;