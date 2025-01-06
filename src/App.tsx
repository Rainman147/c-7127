import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { AppRouter } from './app/Router';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <TemplateProvider>
          <AppRouter />
        </TemplateProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;