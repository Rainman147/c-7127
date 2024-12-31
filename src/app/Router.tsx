import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import ProtectedLayout from '@/components/layout/ProtectedLayout';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat/:sessionId?" element={<ChatPage />} />
          <Route path="/patients" element={<PatientsListPage />} />
          <Route path="/patients/:patientId" element={<PatientDetailPage />} />
          <Route path="/templates" element={<TemplatesListPage />} />
          <Route path="/templates/:templateId" element={<TemplateDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;