import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-chatgpt-main overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 relative transition-all duration-300 ease-in-out",
        isOpen ? "md:ml-64" : "ml-0"
      )}>
        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;