import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

const TemplateManagerContent = () => {
  const { isOpen, open } = useSidebar();

  return (
    <main className="flex-1 space-y-4 p-4 sm:p-6">
      <Button
        onClick={open}
        variant="ghost"
        size="icon"
        className={cn(
          "transition-all duration-300 ease-in-out text-white/70 hover:text-white fixed",
          isOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
          "z-50" // Ensure button stays above other content
        )}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <TemplateManagerComponent />
    </main>
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