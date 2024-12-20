import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { clearSession, validateSession } from '@/utils/auth/sessionManager';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSessionError = useCallback(async () => {
    console.log('[ProtectedRoute] Handling session error');
    if (!isRedirecting) {
      setIsRedirecting(true);
      await clearSession();
      navigate('/auth', { replace: true });
    }
  }, [navigate, isRedirecting]);

  useEffect(() => {
    console.log('[ProtectedRoute] Component mounted');
    let mounted = true;
    
    const checkSession = async () => {
      if (!mounted) return;
      
      const isValid = await validateSession();
      if (!mounted) return;
      
      setIsValidating(false);
      
      if (!isValid) {
        console.log('[ProtectedRoute] Session invalid, handling error');
        await handleSessionError();
        return;
      }
      
      console.log('[ProtectedRoute] Session valid');
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ProtectedRoute] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedRoute] No session, handling error');
        await handleSessionError();
      }
    });

    return () => {
      console.log('[ProtectedRoute] Cleaning up');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, handleSessionError]);

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Validating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;