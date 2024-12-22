import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SidebarToggle } from '@/components/SidebarToggle';
import { useEffect } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

const TemplateManager = () => {
  const { isOpen } = useSidebar();

  useEffect(() => {
    console.log('[TemplateManager] Page mounted with sidebar state:', { isOpen });
    
    return () => {
      console.log('[TemplateManager] Page unmounting');
    };
  }, [isOpen]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <SidebarToggle />
        <TemplateManagerComponent />
      </div>
    </ProtectedRoute>
  );
};

export default TemplateManager;