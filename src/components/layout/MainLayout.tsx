import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MainLayout = () => {
  const { isOpen, toggle } = useSidebar();
  
  console.log('[MainLayout] Rendering with sidebar:', { isOpen });

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isOpen} 
        onToggle={toggle}
        onApiKeyChange={() => {}}
        onSessionSelect={() => {}}
      />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out relative",
        isOpen ? "md:pl-64" : "pl-0"
      )}>
        {/* Global Header - Always on top with debug styles */}
        <header className="fixed top-0 left-0 right-0 z-[200] h-[60px] border-b-2 border-red-500 bg-chatgpt-main">
          <div 
            className="flex h-full items-center px-4 border-2 border-blue-500"
            style={{ background: 'rgba(33, 33, 33, 0.95)' }}
          >
            <Button
              onClick={() => {
                console.log('[MainLayout] Toggle button clicked, current state:', { isOpen });
                toggle();
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-white/10 transition-colors mr-4 border-2 border-green-500 !bg-gray-700"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
          </div>
        </header>

        {/* Main Content with proper spacing */}
        <main className="flex-1 pt-[60px] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;