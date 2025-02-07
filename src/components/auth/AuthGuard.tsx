
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import AuthLoadingState from './AuthLoadingState';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  console.log('[AuthGuard] Render:', { status, hasSession: !!session, pathname: location.pathname });

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') {
      console.log('[AuthGuard] No session, redirecting to auth');
      
      // Show toast only if user was trying to access a protected route
      if (location.pathname !== '/auth') {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue.",
          variant: "destructive",
        });
      }
      
      // Redirect to login while preserving the attempted URL
      navigate('/auth', {
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [status, navigate, location.pathname, toast]);

  if (status === 'INITIALIZING') {
    console.log('[AuthGuard] Showing loading state');
    return <AuthLoadingState />;
  }

  if (status === 'UNAUTHENTICATED') {
    console.log('[AuthGuard] Unauthenticated, rendered null');
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
