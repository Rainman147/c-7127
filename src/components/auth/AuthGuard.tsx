
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingState from './AuthLoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { session, status } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') {
      console.log('[AuthGuard] No session found, redirecting to auth');
      toast({
        title: "Authentication required",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [status, navigate, toast]);

  if (status === 'INITIALIZING' || status === 'CHECKING_SESSION') {
    return <AuthLoadingState />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
