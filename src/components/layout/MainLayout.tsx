import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import AppHeader from './AppHeader';
import { cn } from '@/lib/utils';
import { useEffect, useCallback } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

const MainLayout = () => {
  const { isOpen } = useSidebar();
  
  // Optimized viewport change handler with debouncing
  const handleResize = useCallback(() => {
    const memory = (performance as any).memory as MemoryInfo | undefined;
    
    console.log('[MainLayout] Viewport changed:', { 
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      performance: {
        memory: memory ? {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576),
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576)
        } : 'Not available'
      }
    });
  }, []);

  // Log initial viewport and set up resize listener
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 250);
    };

    // Initial log
    handleResize();

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleResize]);

  // Performance monitoring for layout changes
  useEffect(() => {
    const startTime = performance.now();
    console.log('[MainLayout] Rendering with sidebar state:', { 
      isOpen,
      isMobile: window.innerWidth < 768,
      renderTime: `${Math.round(performance.now() - startTime)}ms`
    });
  }, [isOpen]);

  return (
    <div className="relative min-h-screen flex w-full bg-chatgpt-main">
      <Sidebar />
      
      <div 
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          "transition-transform duration-300 ease-in-out will-change-transform",
          isOpen ? "md:ml-64" : "ml-0",
          "px-2 md:px-4"
        )}
        style={{
          contain: 'paint layout',
        }}
      >
        <AppHeader />
        
        <main className="flex-1 py-4 md:p-4 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;