
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import Login from '@/components/Login';
import AuthLoadingState from '@/components/auth/AuthLoadingState';

const LoginPage = () => {
  const { status, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('[AuthPage] Render:', { status, hasSession: !!session });

  useEffect(() => {
    if (session) {
      console.log('[AuthPage] Session detected, redirecting');
      // Redirect to the attempted URL or home
      const attemptedPath = location.state?.from || '/';
      navigate(attemptedPath, { replace: true });
    }
  }, [session, navigate, location.state?.from]);

  if (status === 'INITIALIZING') {
    console.log('[AuthPage] Still initializing auth');
    return <AuthLoadingState />;
  }

  return <Login />;
};

export default LoginPage;
