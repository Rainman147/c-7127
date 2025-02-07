
import { useAuth } from '@/contexts/auth/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { status } = useAuth();
  console.log('[AuthGuard] Current status:', status);
  
  return <>{children}</>;
};

export default AuthGuard;
