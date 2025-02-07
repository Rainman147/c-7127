
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import { useAuth } from '@/contexts/auth/AuthContext';
import AuthLoadingState from '@/components/auth/AuthLoadingState';

const Router = () => {
  const { status } = useAuth();
  console.log('[Router] Render:', { status });

  if (status === 'INITIALIZING') {
    console.log('[Router] Showing loading state');
    return <AuthLoadingState />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ChatPage />} />
        <Route path="/c/:sessionId" element={<ChatPage />} />
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/new" element={<PatientDetailPage isNew={true} />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage isNew={false} />} />
        <Route path="/templates" element={<TemplatesListPage />} />
        <Route path="/templates/:templateId" element={<TemplateDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
