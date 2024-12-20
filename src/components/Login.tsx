import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStateChange } from '@/hooks/useAuthStateChange';
import { clearSession } from '@/utils/auth/sessionManager';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  useAuthStateChange();
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Check if there's an existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Found existing session, clearing it');
          await clearSession();
          console.log('Session cleared on Login component mount');
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error during session cleanup:', error);
        toast({
          title: "Session Error",
          description: "There was an issue clearing your previous session. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    init();
  }, [toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        
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
              container: {
                gap: '16px',
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