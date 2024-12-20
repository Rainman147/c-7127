import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import ProtectedRoute from '@/components/ProtectedRoute';

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
      <TemplateManagerContent />
    </ProtectedRoute>
  );
};

export default TemplateManager;