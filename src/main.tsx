import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import Auth from './pages/Auth.tsx';
import Index from './pages/Index.tsx';
import TemplateManager from './pages/TemplateManager.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
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
      </Routes>
      <Toaster />
    </BrowserRouter>
  </ToastProvider>
);