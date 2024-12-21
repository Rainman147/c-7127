import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import Auth from './pages/Auth.tsx';
import Index from './pages/Index.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { TemplateProvider } from './contexts/TemplateContext';
import { SidebarProvider } from './contexts/SidebarContext';
import MainLayout from './components/layout/MainLayout';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TemplateProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={
              <ProtectedRoute>
                <SidebarProvider>
                  <MainLayout />
                </SidebarProvider>
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/c/new" replace />} />
              <Route path="/c/new" element={<Index />} />
              <Route path="/c/:sessionId" element={<Index />} />
              
              {/* Legacy route redirects */}
              <Route 
                path="/t/:templateId" 
                element={
                  <Navigate 
                    to={{
                      pathname: '/c/new',
                      search: `template=${window.location.pathname.split('/')[2]}`
                    }}
                    replace 
                  />
                } 
              />
              <Route 
                path="/p/:patientId" 
                element={
                  <Navigate 
                    to={{
                      pathname: '/c/new',
                      search: `patient=${window.location.pathname.split('/')[2]}`
                    }}
                    replace 
                  />
                } 
              />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TemplateProvider>
    </ToastProvider>
  </QueryClientProvider>
);