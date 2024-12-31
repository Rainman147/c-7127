import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar />
      {children}
    </div>
  );
};

export default MainLayout;