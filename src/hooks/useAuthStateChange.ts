import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAuthStateChange = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthStateChange = (event: string) => {
      console.log('Auth event:', event);
      
      switch (event) {
        case 'SIGNED_OUT':
          toast({
            title: "Signed out",
            description: "Successfully signed out.",
          });
          break;
        case 'USER_UPDATED':
          toast({
            title: "Profile updated",
            description: "Your profile has been updated.",
          });
          break;
        case 'PASSWORD_RECOVERY':
          toast({
            title: "Password recovery",
            description: "Check your email for password reset instructions.",
          });
          break;
        case 'TOKEN_REFRESHED':
          console.log('Auth token refreshed successfully');
          break;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      handleAuthStateChange(event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);
};