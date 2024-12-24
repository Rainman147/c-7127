import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('[AuthProvider] Initializing with location:', location.pathname);

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    console.log('[AuthProvider] Auth state changed:', {
      event,
      sessionExists: !!session,
      currentPath: location.pathname
    });

    if (event === 'SIGNED_OUT' || !session) {
      console.log('[AuthProvider] User signed out or no session, redirecting to auth');
      if (location.pathname !== '/auth') {
        navigate('/auth');
      }
    }

    if (event === 'TOKEN_REFRESHED') {
      console.log('[AuthProvider] Token refreshed successfully');
    }

    setUser(session?.user ?? null);
    setLoading(false);
  }, [navigate, location.pathname]);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthProvider] Initializing auth state');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthProvider] Auth initialization error:', error);
          if (error.message?.includes('refresh_token_not_found')) {
            await supabase.auth.signOut();
            if (location.pathname !== '/auth') {
              navigate('/auth');
            }
          }
          return;
        }

        setUser(session?.user ?? null);
      } catch (error) {
        console.error('[AuthProvider] Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      console.log('[AuthProvider] Cleaning up auth subscriptions');
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};