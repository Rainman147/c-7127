
import Login from '@/components/Login';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

const LoginPage = () => {
  const { session, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('[AuthPage] Render:', { status, hasSession: !!session });

  useEffect(() => {
    if (session) {
      console.log('[AuthPage] Session detected, redirecting');
      // Redirect to the originally attempted URL or default to home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [session, navigate, location]);

  if (status === 'INITIALIZING') {
    console.log('[AuthPage] Still initializing auth');
    return null;
  }

  return <Login />;
};

export default LoginPage;
