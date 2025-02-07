
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
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
