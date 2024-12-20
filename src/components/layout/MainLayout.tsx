import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { isOpen, toggle } = useSidebar();
  
  console.log('[MainLayout] Starting render with sidebar:', { isOpen });

  return (
    <div className="flex h-screen bg-chatgpt-main">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isOpen} 
        onToggle={toggle}
        onApiKeyChange={() => {}}
        onSessionSelect={() => {}}
      />
      
      {/* Main Content Container */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "md:pl-64" : "pl-0"
      )}>
        {/* Debug Toggle Button - Large and Visible */}
        <Button
          onClick={() => {
            console.log('[MainLayout] Debug toggle clicked, current state:', { isOpen });
            toggle();
          }}
          className="fixed top-4 left-4 z-[9999] bg-red-500 hover:bg-red-600 w-[100px] h-[100px] rounded-none"
          aria-label="Debug toggle sidebar"
        >
          <Menu className="h-8 w-8 text-white" />
        </Button>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;