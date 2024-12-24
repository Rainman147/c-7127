import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { RealTimeProvider } from '@/contexts/RealTimeContext';
import AppRoutes from '@/routes';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  console.log('[App] Initializing app with providers');
  
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RealTimeProvider>
            <TemplateProvider>
              <AppRoutes />
              <Toaster />
            </TemplateProvider>
          </RealTimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;