
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import ProtectedLayout from '@/features/layout/components/ProtectedLayout';
import { withAuth } from '@/components/auth/withAuth';

const Router = () => {
  console.log('[Router] Initializing router');
  
  // Wrap ChatPage and other protected components with withAuth
  const ProtectedChatPage = withAuth(ChatPage);
  const ProtectedPatientsListPage = withAuth(PatientsListPage);
  const ProtectedPatientDetailPage = withAuth(PatientDetailPage);
  const ProtectedTemplatesListPage = withAuth(TemplatesListPage);
  const ProtectedTemplateDetailPage = withAuth(TemplateDetailPage);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={
          <ProtectedLayout>
            <ProtectedChatPage />
          </ProtectedLayout>
        } />
        
        <Route path="/c/:sessionId" element={
          <ProtectedLayout>
            <ProtectedChatPage />
          </ProtectedLayout>
        } />
        
        <Route path="/patients" element={
          <ProtectedLayout>
            <ProtectedPatientsListPage />
          </ProtectedLayout>
        } />
        <Route path="/patients/new" element={
          <ProtectedLayout>
            <ProtectedPatientDetailPage isNew={true} />
          </ProtectedLayout>
        } />
        <Route path="/patients/:patientId" element={
          <ProtectedLayout>
            <ProtectedPatientDetailPage isNew={false} />
          </ProtectedLayout>
        } />
        
        <Route path="/templates" element={
          <ProtectedLayout>
            <ProtectedTemplatesListPage />
          </ProtectedLayout>
        } />
        <Route path="/templates/:templateId" element={
          <ProtectedLayout>
            <ProtectedTemplateDetailPage />
          </ProtectedLayout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
