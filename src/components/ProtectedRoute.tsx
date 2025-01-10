import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { status, error } = useSession();

  useEffect(() => {
    const validateSession = async () => {
      console.log('[ProtectedRoute] Validating session...');
      const { session, error } = await checkSession();

      if (error || !session) {
        console.log('[ProtectedRoute] Session validation failed:', error?.message || 'No session found');
        toast({
          title: error ? "Authentication Error" : "Session Expired",
          description: error?.message || "Please sign in to continue",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    if (status === 'error') {
      console.log('[ProtectedRoute] Session validation error:', error?.message);
      navigate('/auth');
    }

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] User signed out or session expired, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      console.log('[ProtectedRoute] Cleaning up protected route subscription');
      subscription.unsubscribe();
    };
  }, [navigate, toast, status, error]);

  if (status === 'validating') {
    console.log('[ProtectedRoute] Session validation in progress...');
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default ProtectedRoute;