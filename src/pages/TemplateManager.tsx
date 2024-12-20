import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProfileMenu } from '@/components/header/ProfileMenu';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';

const TemplateManagerContent = () => {
  const profilePhotoUrl = useProfilePhoto();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex justify-end p-4 border-b border-white/20">
        <ProfileMenu profilePhotoUrl={profilePhotoUrl} />
      </div>
      <main className="p-4 sm:p-6">
        <TemplateManagerComponent />
      </main>
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