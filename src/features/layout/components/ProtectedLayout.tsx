
import Sidebar from './Sidebar';
import { useUI } from '@/contexts/UIContext';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { isSidebarOpen, isDesktop } = useUI();

  return (
    <div className="flex h-screen bg-chatgpt-main overflow-hidden">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-300 overflow-y-auto ${
          isSidebarOpen && isDesktop ? 'ml-64' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ProtectedLayout;
