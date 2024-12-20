import { useState } from 'react';
import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import Sidebar from '@/components/Sidebar';
import { useSidebar, SidebarProvider } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';

const TemplateManagerContent = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggle}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-lg font-semibold">Template Manager</h1>
          </div>
        </header>
        
        <main className="flex-1 space-y-4 p-4 sm:p-6">
          <TemplateManagerComponent />
        </main>
      </div>
    </div>
  );
};

const TemplateManager = () => {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <TemplateManagerContent />
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default TemplateManager;