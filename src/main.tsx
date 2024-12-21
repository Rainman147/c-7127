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

// Create a client
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
              {/* Redirect root to /c/new */}
              <Route path="/" element={<Navigate to="/c/new" replace />} />
              
              {/* Chat routes */}
              <Route path="/c/new" element={<Index />} />
              <Route path="/c/:sessionId" element={<Index />} />
              
              {/* Legacy routes - redirect to chat with query params */}
              <Route 
                path="/t/:templateId" 
                element={<Navigate to={(location) => ({
                  pathname: '/c/new',
                  search: `?template=${location.pathname.split('/')[2]}`
                })} replace />} 
              />
              <Route 
                path="/p/:patientId" 
                element={<Navigate to={(location) => ({
                  pathname: '/c/new',
                  search: `?patient=${location.pathname.split('/')[2]}`
                })} replace />} 
              />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </TemplateProvider>
    </ToastProvider>
  </QueryClientProvider>
);