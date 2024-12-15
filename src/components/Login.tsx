import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const Login = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for auth state changes to show appropriate messages
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN') {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      } else if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "Successfully signed out.",
        });
      } else if (event === 'USER_UPDATED') {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated.",
        });
      } else if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password recovery",
          description: "Check your email for password reset instructions.",
        });
      } else if (event === 'USER_DELETED') {
        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted.",
        });
      }
    });

    // Also listen for auth errors
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'AUTH_ERROR') {
        toast({
          title: "Authentication Error",
          description: "There was a problem with authentication. Please try again.",
          variant: "destructive",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 bg-[#2F2F2F] rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '0.375rem',
                  buttonBorderRadius: '0.375rem',
                  inputBorderRadius: '0.375rem',
                },
              }
            },
            style: {
              button: {
                padding: '8px 16px',
                fontSize: '14px',
              },
              input: {
                padding: '8px 12px',
                fontSize: '14px',
              },
            },
          }}
          theme="dark"
          providers={['google']}
          redirectTo={window.location.origin}
          magicLink={false}
        />
      </div>
    </div>
  );
};

export default Login;