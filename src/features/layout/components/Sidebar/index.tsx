import { useState, useEffect } from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useUI } from '@/contexts/UIContext';
import SidebarHeader from './SidebarHeader';
import SidebarContent from './SidebarContent';
import SidebarFooter from './SidebarFooter';

interface SidebarProps {
  onApiKeyChange?: (apiKey: string) => void;
  onSessionSelect?: (sessionId: string) => void;
}

const Sidebar = ({ 
  onApiKeyChange = () => {}, 
  onSessionSelect = () => {} 
}: SidebarProps) => {
  console.log('[Sidebar] Rendering');
  const { isSidebarOpen } = useUI();
  const [apiKey, setApiKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  const handleApiKeyChange = (newApiKey: string) => {
    console.log('[Sidebar] API key changed');
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  const handleNewChat = async () => {
    console.log('[Sidebar] Creating new chat');
    const sessionId = await createSession();
    if (sessionId) {
      setActiveSessionId(sessionId);
      onSessionSelect(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('[Sidebar] Session selected:', sessionId);
    setActiveSessionId(sessionId);
    onSessionSelect(sessionId);
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
      isSidebarOpen ? "w-64" : "w-0"
    }`}>
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <SidebarHeader />
        
        {isSidebarOpen && (
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