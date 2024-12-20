import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import Auth from './pages/Auth.tsx';
import Index from './pages/Index.tsx';
import TemplateManager from './pages/TemplateManager.tsx';
import Patients from './pages/Patients.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { TemplateProvider } from './contexts/TemplateContext';
import { SidebarProvider } from './contexts/SidebarContext';
import './index.css';

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ToastProvider>
      <TemplateProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <TemplateManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <Patients />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </SidebarProvider>
      </TemplateProvider>
    </ToastProvider>
  </QueryClientProvider>
);