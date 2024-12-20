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
        "flex-1 transition-all duration-300 ease-in-out relative",
        isOpen ? "md:pl-64" : "pl-0"
      )}>
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-[60px] border-b border-white/20 bg-chatgpt-main/95 backdrop-blur">
          <div className="flex h-full items-center px-4">
            <Button
              onClick={() => {
                console.log('[MainLayout] Toggle button clicked, current state:', { isOpen });
                toggle();
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-white/10 transition-colors mr-2"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-white/70" />
            </Button>
          </div>
        </header>

        {/* Main Content with proper spacing */}
        <main className="pt-[60px] h-full overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;