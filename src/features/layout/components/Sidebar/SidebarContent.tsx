import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatList from './ChatList';
import { Link } from 'react-router-dom';

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

      {/* Navigation Links */}
      <nav className="mb-4">
        <Link
          to="/patients"
          className="block py-2 px-4 mb-2 text-white hover:text-gray-300 transition-colors duration-200 rounded-xl"
        >
          Patients
        </Link>
        <Link
          to="/templates"
          className="block py-2 px-4 text-white hover:text-gray-300 transition-colors duration-200 rounded-xl"
        >
          Templates
        </Link>
      </nav>

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