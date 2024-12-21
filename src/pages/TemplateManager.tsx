import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SidebarToggle } from '@/components/patients/SidebarToggle';

const TemplateManager = () => {
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