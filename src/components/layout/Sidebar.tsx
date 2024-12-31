import { Link } from 'react-router-dom';
import { Home, MessageSquare, Users, FileText, Settings } from 'lucide-react';
import SidebarHeader from './Sidebar/SidebarHeader';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSessionSelect?: (sessionId: string) => void;
}

const Sidebar = ({ isOpen, onToggle, onSessionSelect = () => {} }: SidebarProps) => {
  const [activeTab, setActiveTab] = useState<string>('home');

  return (
    <div className={cn(
      "fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300",
      isOpen ? "w-64" : "w-0"
    )}>
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <SidebarHeader onToggle={onToggle} />
        {isOpen && (
          <>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className={`flex items-center p-4 text-white hover:bg-chatgpt-hover`}
                  onClick={() => setActiveTab('home')}
                >
                  <Home className="mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/chat"
                  className={`flex items-center p-4 text-white hover:bg-chatgpt-hover`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="mr-2" />
                  Chat
                </Link>
              </li>
              <li>
                <Link
                  to="/patients"
                  className={`flex items-center p-4 text-white hover:bg-chatgpt-hover`}
                  onClick={() => setActiveTab('patients')}
                >
                  <Users className="mr-2" />
                  Patients
                </Link>
              </li>
              <li>
                <Link
                  to="/templates"
                  className={`flex items-center p-4 text-white hover:bg-chatgpt-hover`}
                  onClick={() => setActiveTab('templates')}
                >
                  <FileText className="mr-2" />
                  Templates
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  className={`flex items-center p-4 text-white hover:bg-chatgpt-hover`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="mr-2" />
                  Settings
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;