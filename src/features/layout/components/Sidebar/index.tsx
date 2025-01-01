import { useState, useEffect } from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import SidebarHeader from './SidebarHeader';
import SidebarContent from './SidebarContent';
import SidebarFooter from './SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onApiKeyChange?: (apiKey: string) => void;
  onSessionSelect?: (sessionId: string) => void;
}

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  onApiKeyChange = () => {}, 
  onSessionSelect = () => {} 
}: SidebarProps) => {
  const [apiKey, setApiKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      setActiveSessionId(sessionId);
      onSessionSelect(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    onSessionSelect(sessionId);
    if (isMobile) {
      onToggle();
    }
  };

  const handleSessionEdit = (session: { id: string; title: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSessionDelete = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  return (
    <div className={`fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300 ${
      isOpen ? "w-64" : "w-0"
    }`}>
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <SidebarHeader onToggle={onToggle} />
        
        {isOpen && (
          <>
            <SidebarContent
              onNewChat={handleNewChat}
              activeSessionId={activeSessionId}
              sessions={sessions}
              onSessionSelect={handleSessionClick}
              onSessionEdit={handleSessionEdit}
              onSessionDelete={handleSessionDelete}
            />
            
            <SidebarFooter
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
            />
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;