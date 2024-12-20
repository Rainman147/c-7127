import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar, SidebarProvider } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayoutContent = ({ children }: MainLayoutProps) => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isOpen} 
        onToggle={toggle}
        onApiKeyChange={() => {}}
        onSessionSelect={() => {}}
      />
      
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="fixed top-0 left-0 z-40 h-[60px] w-full bg-chatgpt-main/95 backdrop-blur flex items-center px-4">
          <Button
            onClick={toggle}
            variant="ghost"
            className={`${isOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-[60px]">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider>
      <MainLayoutContent children={children} />
    </SidebarProvider>
  );
};

export default MainLayout;