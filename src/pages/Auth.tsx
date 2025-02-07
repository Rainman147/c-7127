
import Login from '@/components/Login';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

const Auth = () => {
  const { session, status } = useAuth();
  const navigate = useNavigate();

  console.log('[AuthPage] Render:', { status, hasSession: !!session });

  useEffect(() => {
    if (session) {
      console.log('[AuthPage] Session detected, redirecting to home');
      navigate('/');
    }
  }, [session, navigate]);

  if (status === 'INITIALIZING') {
    console.log('[AuthPage] Still initializing auth');
    return null;
  }

  return <Login />;
};

export default Auth;
