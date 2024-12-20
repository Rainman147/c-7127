import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from '@/contexts/SidebarContext';
import MainLayout from '@/components/layout/MainLayout';
import Index from '@/pages/Index';
import TemplateManager from '@/pages/TemplateManager';

const App = () => {
  return (
    <Router>
      <SidebarProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/templates" element={<TemplateManager />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </Router>
  );
};

export default App;
