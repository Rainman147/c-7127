
import Login from '@/components/Login';
import { useAuth } from '@/contexts/auth/AuthContext';

const LoginPage = () => {
  const { status } = useAuth();
  console.log('[LoginPage] Auth status:', status);
  
  // During cleanup phase, we're only rendering the login component
  return <Login />;
};

export default LoginPage;
