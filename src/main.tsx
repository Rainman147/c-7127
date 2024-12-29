import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SidebarProvider } from '@/contexts/SidebarContext'
import MainLayout from '@/components/layout/MainLayout'
import PatientsPage from '@/pages/Patients'
import TemplateManager from '@/pages/TemplateManager'
import Auth from '@/pages/Auth'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<App />} />
            <Route path="/c/:sessionId" element={<App />} />
            <Route path="/patients" element={<PatientsPage />} />
            <Route path="/templates" element={<TemplateManager />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  </React.StrictMode>
);