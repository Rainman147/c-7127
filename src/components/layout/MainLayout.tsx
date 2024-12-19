import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';

const MainLayout = () => {
  const [apiKey, setApiKey] = useState("");
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  return (
    <div className="flex h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApiKeyChange={handleApiKeyChange}
        onSessionSelect={() => {}}
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;