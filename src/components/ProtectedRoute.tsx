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
      console.log('Validating session...');
      const { session, error } = await checkSession();

      if (error) {
        console.log('Session validation failed:', error.message);
        
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
        console.log('No active session found');
        navigate('/auth');
        return;
      }
    };

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed in protected route:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session expired, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      console.log('Cleaning up protected route subscription');
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return <>{children}</>;
};

export default ProtectedRoute;