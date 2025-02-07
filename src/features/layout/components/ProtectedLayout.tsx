
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSidebarOpen, isDesktop } = useUI();

  useEffect(() => {
    console.log('[ProtectedLayout] Initializing');
    
    const validateSession = async () => {
      console.log('[ProtectedLayout] Validating session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[ProtectedLayout] Session validation error:', error);
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      if (!session) {
        console.log('[ProtectedLayout] No active session found');
        navigate('/auth');
      }
    };

    validateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ProtectedLayout] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
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
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen && isDesktop ? 'ml-64' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;
