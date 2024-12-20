import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import AppHeader from './AppHeader';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { isOpen } = useSidebar();
  
  console.log('[MainLayout] Rendering with sidebar state:', { isOpen });

  return (
    <div className="flex h-screen bg-chatgpt-main overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 relative transition-all duration-300 ease-in-out",
        isOpen ? "md:ml-64" : "ml-0"
      )}>
        <AppHeader />
        
        {/* Main content */}
        <div className="mt-[60px] p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;