import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import ProtectedLayout from '@/features/layout/components/ProtectedLayout';

export const AppRouter = () => {
  console.log('[Router] Initializing router');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        {/* Root route with optional template and patient params */}
        <Route path="/" element={
          <ProtectedLayout>
            <ChatPage />
          </ProtectedLayout>
        } />
        
        {/* Chat session route with optional template and patient params */}
        <Route path="/c/:sessionId" element={
          <ProtectedLayout>
            <ChatPage />
          </ProtectedLayout>
        } />
        
        {/* Patient routes */}
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
        
        {/* Template routes */}
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
        
        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;