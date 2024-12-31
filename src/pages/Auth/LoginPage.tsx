import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const LoginPage = () => {
  const navigate = useNavigate();
  const { redirectIfAuthenticated } = useAuthRedirect();

  useEffect(() => {
    redirectIfAuthenticated();
  }, [redirectIfAuthenticated]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-chatgpt-main p-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-chatgpt-sidebar p-8">
        <SupabaseAuth 
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={`${window.location.origin}/`}
        />
      </div>
    </div>
  );
};

export default LoginPage;