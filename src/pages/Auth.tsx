import Login from '@/components/Login';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const Auth = () => {
  useAuthRedirect();
  return <Login />;
};

export default Auth;