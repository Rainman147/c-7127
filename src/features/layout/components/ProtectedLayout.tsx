
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';
import { withAuth } from '@/components/auth/withAuth';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { isSidebarOpen, isDesktop } = useUI();

  return (
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
  );
};

// Wrap with withAuth HOC instead of implementing protection logic directly
export default withAuth(ProtectedLayout);
