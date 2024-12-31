import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { checkSession } from '@/utils/auth/sessionManager';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';

const ProtectedLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSidebarOpen, toggleSidebar } = useUI();

  useEffect(() => {
    const validateSession = async () => {
      console.log('Validating session in ProtectedLayout...');
      const { session, error } = await checkSession();

      if (error || !session) {
        console.log('Session validation failed:', error?.message || 'No session found');
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
      console.log('Auth state changed in protected layout:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session expired, redirecting to auth');
        navigate('/auth');
      }
    });

    return () => {
      console.log('Cleaning up protected layout subscription');
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleSessionSelect = (sessionId: string) => {
    console.log('Session selected in ProtectedLayout:', sessionId);
    navigate(`/chat/${sessionId}`);
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onSessionSelect={handleSessionSelect}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;