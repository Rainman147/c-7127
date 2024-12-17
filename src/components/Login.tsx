import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const Login = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthStateChange = (event: string) => {
      switch (event) {
        case 'SIGNED_IN':
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google.",
          });
          break;
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
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      handleAuthStateChange(event);
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
                  brand: '#4285f4', // Google blue
                  brandAccent: '#1a73e8', // Darker Google blue
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
                padding: '10px 16px',
                fontSize: '14px',
                fontFamily: 'Google Sans, Roboto, sans-serif',
                fontWeight: '500',
                height: '40px',
                textTransform: 'none',
              },
              anchor: {
                color: '#4285f4',
                fontSize: '14px',
              },
            },
          }}
          theme="dark"
          providers={['google']}
          redirectTo={window.location.origin}
          onlyThirdPartyProviders={true}
        />
      </div>
    </div>
  );
};

export default Login;