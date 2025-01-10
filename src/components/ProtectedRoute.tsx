import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSessionManagement } from '@/hooks/useSessionManagement';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isValidating } = useSessionManagement();

  useEffect(() => {
    const startTime = performance.now();
    console.log('[ProtectedRoute] Checking session state:', {
      isValidating,
      hasSession: !!session,
      timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
    });

    if (!isValidating && !session) {
      console.log('[ProtectedRoute] No valid session, redirecting to auth', {
        timeElapsed: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      toast({
        title: "Session Expired",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [session, isValidating, navigate, toast]);

  if (isValidating) {
    console.log('[ProtectedRoute] Session validation in progress...');
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;