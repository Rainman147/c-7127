import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatList from './ChatList';

interface SidebarContentProps {
  onNewChat: () => void;
  activeSessionId: string | null;
  sessions: any[];
  onSessionSelect: (sessionId: string) => void;
  onSessionEdit: (session: { id: string; title: string }) => void;
  onSessionDelete: (sessionId: string) => void;
}

const SidebarContent = ({
  onNewChat,
  activeSessionId,
  sessions,
  onSessionSelect,
  onSessionEdit,
  onSessionDelete
}: SidebarContentProps) => {
  return (
    <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto sidebar-scrollbar">
      <div className="mb-4">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 bg-[#2F2F2F] hover:bg-[#404040] rounded-xl"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ChatList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={onSessionSelect}
        onSessionEdit={onSessionEdit}
        onSessionDelete={onSessionDelete}
      />
    </div>
  );
};

export default SidebarContent;