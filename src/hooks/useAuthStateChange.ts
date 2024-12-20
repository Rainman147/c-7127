import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAuthStateChange = () => {
  const { toast } = useToast();

  useEffect(() => {
    console.log('[useAuthStateChange] Initializing auth state listener');
    
    const handleAuthStateChange = (event: string) => {
      console.log('[useAuthStateChange] Auth event:', event, 'at:', new Date().toISOString());
      
      switch (event) {
        case 'USER_UPDATED':
          console.log('[useAuthStateChange] User profile updated');
          toast({
            title: "Profile updated",
            description: "Your profile has been updated.",
          });
          break;
        case 'PASSWORD_RECOVERY':
          console.log('[useAuthStateChange] Password recovery initiated');
          toast({
            title: "Password recovery",
            description: "Check your email for password reset instructions.",
          });
          break;
        case 'TOKEN_REFRESHED':
          console.log('[useAuthStateChange] Auth token refreshed successfully');
          break;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      handleAuthStateChange(event);
    });

    return () => {
      console.log('[useAuthStateChange] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [toast]);
};