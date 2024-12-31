import { useState, useEffect } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarNav from './SidebarNav';
import SidebarChatList from './SidebarChatList';
import SidebarFooter from './SidebarFooter';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar = ({ isOpen, onToggle, onApiKeyChange, onSessionSelect }: SidebarProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className={cn(
      "fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300",
      isOpen ? "w-64" : "w-0"
    )}>
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <SidebarHeader onToggle={onToggle} />
        
        {isOpen && (
          <>
            <SidebarNav />
            <SidebarChatList 
              onSessionSelect={(sessionId) => {
                onSessionSelect(sessionId);
                if (isMobile) onToggle();
              }}
            />
            <SidebarFooter onApiKeyChange={onApiKeyChange} />
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;