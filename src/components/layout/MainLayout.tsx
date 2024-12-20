import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import AppHeader from './AppHeader';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { isOpen } = useSidebar();
  
  console.log('[MainLayout] Rendering with sidebar state:', { isOpen });

  return (
    <div className="relative min-h-screen flex w-full bg-chatgpt-main">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          "transition-all duration-300 ease-in-out layout-transition will-change-transform",
          isOpen ? "md:ml-64" : "ml-0"
        )}
      >
        <AppHeader />
        
        {/* Main content */}
        <main className="flex-1 p-4 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;