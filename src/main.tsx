import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import Auth from './pages/Auth.tsx';
import Index from './pages/Index.tsx';
import TemplateManager from './pages/TemplateManager.tsx';
import PatientsPage from './pages/Patients.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { SidebarProvider } from './contexts/SidebarContext.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <App>
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
          <Route path="/templates" element={<TemplateManager />} />
          <Route path="/patients" element={<PatientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </App>
);