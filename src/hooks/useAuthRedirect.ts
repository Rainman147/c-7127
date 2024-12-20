import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log('[useAuthRedirect] Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useAuthRedirect] Session check error:', error);
          return;
        }

        if (session && mounted) {
          console.log('[useAuthRedirect] Active session found, redirecting to home');
          navigate('/', { replace: true });
        } else {
          console.log('[useAuthRedirect] No active session found');
        }
      } catch (error) {
        console.error('[useAuthRedirect] Error checking session:', error);
        toast({
          title: "Error",
          description: "There was a problem checking your session.",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuthRedirect] Auth state changed:', event);
      if (session && mounted && !isChecking) {
        console.log('[useAuthRedirect] Session detected, redirecting to home');
        navigate('/', { replace: true });
      }
    });

    return () => {
      console.log('[useAuthRedirect] Cleaning up auth redirect subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast, isChecking]);

  return { isChecking };
};