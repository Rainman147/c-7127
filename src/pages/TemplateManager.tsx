import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import ProtectedRoute from '@/components/ProtectedRoute';

const TemplateManagerContent = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isOpen={isOpen}
        onToggle={toggle}
        onApiKeyChange={() => {}}
        onSessionSelect={() => {}}
      />
      
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-4" />
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
      <TemplateManagerContent />
    </ProtectedRoute>
  );
};

export default TemplateManager;