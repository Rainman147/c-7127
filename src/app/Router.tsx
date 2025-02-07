
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import PatientsListPage from '@/pages/Patients/PatientsListPage';
import PatientDetailPage from '@/pages/Patients/PatientDetailPage';
import TemplatesListPage from '@/pages/Templates/TemplatesListPage';
import TemplateDetailPage from '@/pages/Templates/TemplateDetailPage';
import { useAuth } from '@/contexts/auth/AuthContext';
import AuthLoadingState from '@/components/auth/AuthLoadingState';
import AuthGuard from '@/components/auth/AuthGuard';
import ProtectedLayout from '@/features/layout/components/ProtectedLayout';

// Helper component to handle redirects based on auth state
const AuthRedirect = () => {
  const { session } = useAuth();
  const location = useLocation();
  
  // If user is authenticated and tries to access /auth, redirect to home
  if (session && location.pathname === '/auth') {
    console.log('[Router] Authenticated user accessing /auth, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  // Allow access to the requested route
  return null;
};

const Router = () => {
  const { status } = useAuth();
  console.log('[Router] Render:', { status });

  if (status === 'INITIALIZING') {
    console.log('[Router] Showing loading state');
    return <AuthLoadingState />;
  }

  return (
    <BrowserRouter>
      <AuthRedirect />
      <Routes>
        {/* Public route */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected routes wrapped in AuthGuard and ProtectedLayout */}
        <Route element={
          <AuthGuard>
            <ProtectedLayout>
              <Routes>
                <Route path="/" element={<ChatPage />} />
                <Route path="/c/:sessionId" element={<ChatPage />} />
                <Route path="/patients" element={<PatientsListPage />} />
                <Route path="/patients/new" element={<PatientDetailPage isNew={true} />} />
                <Route path="/patients/:patientId" element={<PatientDetailPage isNew={false} />} />
                <Route path="/templates" element={<TemplatesListPage />} />
                <Route path="/templates/:templateId" element={<TemplateDetailPage />} />
              </Routes>
            </ProtectedLayout>
          </AuthGuard>
        }>
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
