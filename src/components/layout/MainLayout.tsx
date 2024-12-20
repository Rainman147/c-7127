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
        {/* Standalone Toggle Button - Outside header for testing */}
        <Button
          onClick={() => {
            console.log('[MainLayout] Standalone toggle clicked, current state:', { isOpen });
            toggle();
          }}
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-[999] !bg-red-500 hover:!bg-red-600 !visible !block"
          aria-label="Emergency toggle sidebar"
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>

        {/* Global Header */}
        <header 
          className="fixed top-0 left-0 right-0 z-[300] h-[60px] border-b-2 border-red-500 bg-gray-800"
          style={{ 
            visibility: 'visible !important',
            display: 'block !important'
          }}
        >
          <div 
            className="flex h-full items-center px-4 border-2 border-blue-500"
            style={{ 
              background: 'rgba(33, 33, 33, 0.95)',
              visibility: 'visible !important',
              display: 'flex !important'
            }}
          >
            <Button
              onClick={() => {
                console.log('[MainLayout] Header toggle clicked, current state:', { isOpen });
                toggle();
              }}
              variant="ghost"
              size="icon"
              className="!visible !block hover:bg-white/10 transition-colors mr-4 border-2 border-green-500 !bg-gray-700"
              style={{
                position: 'relative',
                zIndex: 9999,
                visibility: 'visible !important',
                display: 'block !important'
              }}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-[60px] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;