import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const MainLayout = ({ children, isSidebarOpen, onSidebarToggle }: MainLayoutProps) => {
  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={onSidebarToggle}
      />
      {children}
    </div>
  );
};

export default MainLayout;