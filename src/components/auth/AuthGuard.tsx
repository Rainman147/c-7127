
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import AuthLoadingState from './AuthLoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  
  console.log('[AuthGuard] Render:', { status, hasSession: !!session });

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') {
      console.log('[AuthGuard] No session, redirecting to auth');
      navigate('/auth');
    }
  }, [status, navigate]);

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
