import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { isSidebarOpen, isDesktop, setSidebarOpen } = useUI();
  const [apiKey, setApiKey] = useState("");
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    deleteSession,
    renameSession,
  } = useChatSessions();

  const handleApiKeyChange = (newApiKey: string) => {
    console.log('[Sidebar] API key changed');
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('[Sidebar] Session selected:', sessionId);
    setActiveSessionId(sessionId);
    navigate(`/c/${sessionId}`);
    onSessionSelect(sessionId);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  const handleBackdropClick = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {!isDesktop && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      <div 
        className={`fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300 
          ${isSidebarOpen ? "w-64" : "w-0"}
          ${!isDesktop && isSidebarOpen ? "shadow-xl" : ""}
        `}
      >
        <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
          <SidebarHeader />
          
          {isSidebarOpen && (
            <>
              <SidebarContent
                activeSessionId={activeSessionId}
                sessions={sessions}
                onSessionSelect={handleSessionClick}
                onSessionEdit={(session) => {
                  renameSession(session.id, session.title);
                }}
                onSessionDelete={deleteSession}
              />
              
              <SidebarFooter
                apiKey={apiKey}
                onApiKeyChange={handleApiKeyChange}
              />
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;