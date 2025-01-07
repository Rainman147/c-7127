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
    console.log('[ProtectedLayout] Initializing');
    
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
    <div className="relative flex h-screen overflow-hidden bg-chatgpt-main">
      {/* Sidebar with fixed positioning */}
      <div 
        className={`fixed top-0 left-0 z-40 h-full w-[260px] transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar />
      </div>

      {/* Secondary buttons container - positioned to match sidebar header */}
      <div 
        className={`fixed top-0 left-0 z-30 h-[60px] px-2 flex items-center transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Secondary buttons will be added here in the next step */}
      </div>

      {/* Main content area with proper margin transition */}
      <main 
        className={`flex-1 overflow-auto transition-[margin] duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-[260px]' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;