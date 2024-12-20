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
        {/* Emergency Toggle Button - Highest z-index */}
        {(() => {
          console.log('[MainLayout] Rendering emergency toggle button');
          return (
            <Button
              onClick={() => {
                console.log('[MainLayout] Emergency toggle clicked, current state:', { isOpen });
                toggle();
              }}
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-red-500 hover:bg-red-600 shadow-lg"
              aria-label="Emergency toggle sidebar"
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
          );
        })()}

        {/* Global Header */}
        <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-chatgpt-main/95 backdrop-blur">
          {(() => {
            console.log('[MainLayout] Rendering header content');
            return (
              <div className="flex h-[60px] items-center px-4">
                <Button
                  onClick={() => {
                    console.log('[MainLayout] Header toggle clicked, current state:', { isOpen });
                    toggle();
                  }}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10 transition-colors mr-4"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </div>
            );
          })()}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;