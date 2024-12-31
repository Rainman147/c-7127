import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import SessionHeader from './SessionHeader';
import SessionList from './SessionList';
import { useChatSessions } from '@/hooks/useChatSessions';

const STORAGE_KEY = 'sidebar-sessions-collapsed';

const SidebarSessions = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  const {
    sessions,
    activeSessionId,
    createSession,
    deleteSession,
    renameSession,
    setActiveSessionId,
  } = useChatSessions();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  };

  const handleSessionEdit = (session: { id: string; title: string }) => {
    const newTitle = window.prompt('Enter new session title:', session.title);
    if (newTitle && newTitle !== session.title) {
      renameSession(session.id, newTitle);
    }
  };

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={(open) => setIsCollapsed(!open)}
      className="space-y-2"
    >
      <SessionHeader
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      <CollapsibleContent className="space-y-2">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onSessionSelect={setActiveSessionId}
          onSessionEdit={handleSessionEdit}
          onSessionDelete={deleteSession}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SidebarSessions;