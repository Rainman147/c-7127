import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSidebarOpen } = useUI();

  useEffect(() => {
    const validateSession = async () => {
      console.log('[ProtectedLayout] Validating session...');
      const { session, error } = await checkSession();

      if (error || !session) {
        console.log('[ProtectedLayout] Session validation failed:', error?.message || 'No session found');
        toast({
          title: error ? "Authentication Error" : "Session Expired",
          description: error?.message || "Please sign in to continue",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedLayout] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('[ProtectedLayout] User signed out or session expired, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      console.log('[ProtectedLayout] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;