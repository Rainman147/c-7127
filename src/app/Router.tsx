import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import ProtectedLayout from '@/features/layout/components/ProtectedLayout';

const Router = () => {
  console.log('[Router] Initializing router');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={
          <ProtectedLayout>
            <ChatPage />
          </ProtectedLayout>
        } />
        
        <Route path="/c/:sessionId" element={
          <ProtectedLayout>
            <ChatPage />
          </ProtectedLayout>
        } />
        
        <Route path="/patients" element={
          <ProtectedLayout>
            <PatientsListPage />
          </ProtectedLayout>
        } />
        <Route path="/patients/new" element={
          <ProtectedLayout>
            <PatientDetailPage isNew={true} />
          </ProtectedLayout>
        } />
        <Route path="/patients/:patientId" element={
          <ProtectedLayout>
            <PatientDetailPage isNew={false} />
          </ProtectedLayout>
        } />
        
        <Route path="/templates" element={
          <ProtectedLayout>
            <TemplatesListPage />
          </ProtectedLayout>
        } />
        <Route path="/templates/:templateId" element={
          <ProtectedLayout>
            <TemplateDetailPage />
          </ProtectedLayout>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;