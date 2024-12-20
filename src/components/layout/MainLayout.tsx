import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';

const MainLayout = () => {
  const [apiKey, setApiKey] = useState("");
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={toggleSidebar}
        onApiKeyChange={handleApiKeyChange}
        onSessionSelect={() => {}}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header with toggle button */}
        <header className="h-[60px] border-b border-white/20 flex items-center px-4 bg-chatgpt-main/95 backdrop-blur fixed top-0 right-0 left-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`transition-transform duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        
        {/* Main content */}
        <main className="flex-1 mt-[60px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;