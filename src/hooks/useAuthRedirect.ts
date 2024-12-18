import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Active session found, redirecting to home');
        navigate('/');
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      if (session) {
        console.log('Session detected, redirecting to home');
        navigate('/');
      }
    });

    return () => {
      console.log('Cleaning up auth redirect subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);
};