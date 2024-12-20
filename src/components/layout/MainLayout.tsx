import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import AppHeader from './AppHeader';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const MainLayout = () => {
  const { isOpen } = useSidebar();
  
  // Log viewport changes
  useEffect(() => {
    const handleResize = () => {
      console.log('[MainLayout] Viewport changed:', { 
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768
      });
    };

    // Log initial viewport
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log('[MainLayout] Rendering with sidebar state:', { 
    isOpen,
    isMobile: window.innerWidth < 768 
  });

  return (
    <div className="relative min-h-screen flex w-full bg-chatgpt-main">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          "transition-all duration-300 ease-in-out layout-transition will-change-transform",
          isOpen ? "md:ml-64" : "ml-0",
          // Enhanced mobile padding
          "px-2 md:px-4"
        )}
      >
        <AppHeader />
        
        {/* Main content with improved mobile spacing */}
        <main className="flex-1 py-4 md:p-4 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;