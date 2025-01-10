import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSessionManagement } from '@/hooks/useSessionManagement';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, isValidating, validateSession } = useSessionManagement();

  useEffect(() => {
    console.log('[ProtectedRoute] Checking session state:', {
      isValidating,
      hasSession: !!session
    });

    if (!isValidating && !session) {
      console.log('[ProtectedRoute] No valid session, redirecting to auth');
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