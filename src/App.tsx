import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { TemplateProvider } from './contexts/TemplateContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Patients from './pages/Patients';
import TemplateManager from './pages/TemplateManager';

const queryClient = new QueryClient();

function App() {
  console.log('[App] Initializing application with providers and routes');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TemplateProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes wrapped in MainLayout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/c/:sessionId" element={<Index />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/templates" element={<TemplateManager />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </TemplateProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;