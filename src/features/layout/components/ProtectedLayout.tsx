
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';
import AuthGuard from '@/components/auth/AuthGuard';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { isSidebarOpen, isDesktop } = useUI();

  return (
    <AuthGuard>
      <div className="flex h-screen bg-chatgpt-main">
        <Sidebar />
        <main 
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen && isDesktop ? 'ml-64' : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>
    </AuthGuard>
  );
};

export default ProtectedLayout;
