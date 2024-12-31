import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/components/Login';

const LoginPage = () => {
  const auth = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      await auth.redirectIfAuthenticated();
    };
    checkAuth();
  }, [auth]);

  return <Login />;
};

export default LoginPage;