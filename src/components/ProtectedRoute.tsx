import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          // Clear any existing session data
          await supabase.auth.signOut();
          throw error;
        }

        if (!session) {
          console.log('No active session, redirecting to auth');
          navigate('/auth');
        }
      } catch (error: any) {
        console.error('Auth error:', error);
        
        // Handle refresh token errors specifically
        if (error.message?.includes('refresh_token_not_found')) {
          toast({
            title: "Session expired",
            description: "Please sign in again",
            variant: "destructive",
          });
          // Ensure we clear any invalid session data
          await supabase.auth.signOut();
        } else {
          toast({
            title: "Authentication Error",
            description: error.message || "Please sign in again",
            variant: "destructive",
          });
        }
        
        navigate('/auth');
      }
    };

    checkSession();

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