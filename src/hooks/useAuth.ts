import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  const redirectIfAuthenticated = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/chat');
    }
  }, [navigate]);

  return {
    signOut,
    redirectIfAuthenticated
  };
};