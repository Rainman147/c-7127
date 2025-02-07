
import Login from '@/components/Login';
import { useAuth } from '@/contexts/auth/AuthContext';

const LoginPage = () => {
  const { status } = useAuth();
  console.log('[LoginPage] Auth status:', status);
  
  // During Phase 1, we're intentionally not implementing navigation logic
  return <Login />;
};

export default LoginPage;
