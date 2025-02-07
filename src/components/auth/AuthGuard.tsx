
import { useAuth } from '@/contexts/auth/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status } = useAuth();
  console.log('[AuthGuard] Current status:', status);
  
  // During Phase 1, we're intentionally not implementing any guards
  // This component will be rebuilt in Phase 3
  return <>{children}</>;
};

export default AuthGuard;
