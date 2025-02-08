
import { useAuth } from '@/contexts/auth/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import AuthLoadingState from './AuthLoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status, session } = useAuth();
  const location = useLocation();
  
  console.log('[AuthGuard] Render:', { status, path: location.pathname });
  
  if (status === 'INITIALIZING') {
    return <AuthLoadingState />;
  }
  
  if (!session && status === 'UNAUTHENTICATED') {
    // Preserve the attempted URL to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default AuthGuard;
