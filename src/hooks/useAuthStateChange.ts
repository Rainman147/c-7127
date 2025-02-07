
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchTemplates } from './queries/useTemplateQueries';

export const useAuthStateChange = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAuthStateChange = async (event: string) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        // Prefetch templates when user signs in
        try {
          await prefetchTemplates(queryClient);
        } catch (error) {
          console.error('Error prefetching templates:', error);
        }
      }
      
      // Only show toasts for critical events
      switch (event) {
        case 'PASSWORD_RECOVERY':
          toast({
            title: "Password recovery",
            description: "Check your email for password reset instructions.",
          });
          break;
        case 'USER_UPDATED':
          toast({
            title: "Profile updated",
            description: "Your profile has been updated.",
          });
          break;
        case 'TOKEN_REFRESHED':
          console.log('Auth token refreshed successfully');
          break;
        default:
          console.log('Auth state changed:', event);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      handleAuthStateChange(event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, queryClient]);
};
