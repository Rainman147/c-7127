import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { TemplateProvider } from './contexts/TemplateContext';

const queryClient = new QueryClient();

function App({ children }: { children: React.ReactNode }) {
  console.log('[App] Initializing application with providers');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TemplateProvider>
          {children}
          <Toaster />
        </TemplateProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;