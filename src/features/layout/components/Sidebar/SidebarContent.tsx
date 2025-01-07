import { Link, useLocation } from 'react-router-dom';
import { Users, FileText } from 'lucide-react';
import ChatList from './ChatList';

interface SidebarContentProps {
  sessions: any[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionEdit: (session: { id: string; title: string }) => void;
  onSessionDelete: (sessionId: string) => void;
}

const SidebarContent = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionEdit,
  onSessionDelete
}: SidebarContentProps) => {
  const location = useLocation();
  console.log('[SidebarContent] Current location:', location.pathname);

  return (
    <div className="flex-1 overflow-y-auto sidebar-scrollbar">
      {/* Navigation Links */}
      <nav className="flex flex-col gap-1 px-2 py-2">
        <Link
          to="/patients"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-chatgpt-hover/45 rounded-lg transition-all duration-200"
        >
          <Users className="h-4 w-4" />
          Patients
        </Link>
        
        <Link
          to="/templates"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-chatgpt-hover/45 rounded-lg transition-all duration-200"
        >
          <FileText className="h-4 w-4" />
          Templates
        </Link>
      </nav>

      {/* Chat List */}
      <div className="mt-2">
        <ChatList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
          onSessionEdit={onSessionEdit}
          onSessionDelete={onSessionDelete}
        />
      </div>
    </div>
  );
};

export default SidebarContent;