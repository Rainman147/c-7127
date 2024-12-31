import { memo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SessionItem from './SessionItem';
import { ChatSession } from '@/hooks/useChatSessions';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSessionSelect: (sessionId: string) => void;
  onSessionEdit: (session: ChatSession) => void;
  onSessionDelete: (sessionId: string) => void;
}

const SessionList = memo(({
  sessions,
  activeSessionId,
  onNewChat,
  onSessionSelect,
  onSessionEdit,
  onSessionDelete
}: SessionListProps) => {
  return (
    <div className="space-y-2">
      <Button
        onClick={onNewChat}
        className="w-full flex items-center gap-2 bg-[#2F2F2F] hover:bg-[#404040] rounded-xl"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
      
      <div className="space-y-1">
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            id={session.id}
            title={session.title}
            isActive={session.id === activeSessionId}
            onSelect={() => onSessionSelect(session.id)}
            onEdit={() => onSessionEdit(session)}
            onDelete={() => onSessionDelete(session.id)}
          />
        ))}
      </div>
    </div>
  );
});

SessionList.displayName = 'SessionList';

export default SessionList;