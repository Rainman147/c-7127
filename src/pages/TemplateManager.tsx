import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import { useSidebar } from '@/contexts/SidebarContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

const TemplateManagerContent = () => {
  return (
    <main className="flex-1 space-y-4 p-4 sm:p-6">
      <TemplateManagerComponent />
    </main>
  );
};

const TemplateManager = () => {
  return (
    <ProtectedRoute>
      <MainLayout>
        <TemplateManagerContent />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default TemplateManager;