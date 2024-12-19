import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState("");

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
  };

  return (
    <div className="flex h-screen relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity md:hidden z-30"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onApiKeyChange={handleApiKeyChange}
        onSessionSelect={() => {}}
      />
      <main className={`flex-1 transition-[margin] duration-300 ease-in-out md:ml-64 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;