
import { useAuth } from '@/contexts/auth/AuthContext';
import AuthLoadingState from './AuthLoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status } = useAuth();

  if (status === 'INITIALIZING' || status === 'CHECKING_SESSION') {
    return <AuthLoadingState />;
  }

  return <>{children}</>;
};

export default AuthGuard;
