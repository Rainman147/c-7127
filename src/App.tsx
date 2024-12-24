import { RealTimeProvider } from '@/contexts/RealTimeContext';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppRoutes from '@/routes';

const App = () => {
  return (
    <RealTimeProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <SidebarProvider>
              <AppRoutes />
              <Toaster />
            </SidebarProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </RealTimeProvider>
  );
};

export default App;