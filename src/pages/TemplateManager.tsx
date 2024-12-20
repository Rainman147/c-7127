import { useState } from 'react';
import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TemplateManager = () => {
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
        <main className="flex-1 overflow-hidden mt-[60px]">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                <TemplateManagerComponent />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TemplateManager;