import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayoutContent = ({ children }: MainLayoutProps) => {
  const { isOpen, open } = useSidebar();

  return (
    <div className="flex h-screen bg-chatgpt-main overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 relative transition-transform duration-300 ease-in-out",
        isOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Header with open button */}
        <div className="fixed top-0 left-0 right-0 h-[60px] bg-chatgpt-main/95 backdrop-blur flex items-center px-4 z-20">
          <Button
            onClick={open}
            variant="ghost"
            className={cn(
              "transition-all duration-300 ease-in-out",
              isOpen ? "opacity-0 -translate-x-full" : "opacity-100 translate-x-0"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Main content */}
        <div className="mt-[60px] p-4">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <MainLayoutContent children={children} />
  );
};

export default MainLayout;