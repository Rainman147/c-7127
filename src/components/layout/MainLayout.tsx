import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect /c/new to root with preserved params
  useEffect(() => {
    if (location.pathname === '/c/new') {
      const searchParams = new URLSearchParams(location.search);
      const queryString = searchParams.toString();
      navigate(`/${queryString ? `?${queryString}` : ''}`, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    console.log('[MainLayout] Mounted with sidebar state:', { isOpen });
  }, [isOpen]);

  return (
    <div className="flex h-screen bg-chatgpt-main overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 relative transition-all duration-300 ease-in-out",
        isOpen ? "md:ml-64" : "ml-0",
        "z-0"
      )}>
        <main className="max-w-[1200px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;