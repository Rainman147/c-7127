import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import { useAuth, AuthProvider } from '@/contexts/auth/AuthContext';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import AuthGuard from '@/components/auth/AuthGuard';
import ProtectedLayout from '@/features/layout/components/ProtectedLayout';

const RouterContent = () => {
  const { status } = useAuth();
  console.log('[Router] Render:', { status });

  if (status === 'INITIALIZING') {
    console.log('[Router] Showing loading state');
    return <AuthLoadingState />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected routes - wrapped in ProtectedLayout and AuthGuard */}
      <Route element={
        <AuthGuard>
          <ProtectedLayout />
        </AuthGuard>
      }>
        {/* Chat routes - both new and existing sessions use ChatPage */}
        <Route path="/" element={<ChatPage key="new-chat" />} />
        <Route path="/c/:sessionId" element={<ChatPage key="existing-chat" />} />
        
        {/* Other protected routes */}
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/new" element={<PatientDetailPage isNew={true} />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage isNew={false} />} />
        <Route path="/templates" element={<TemplatesListPage />} />
        <Route path="/templates/:templateId" element={<TemplateDetailPage />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouterContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Router;
