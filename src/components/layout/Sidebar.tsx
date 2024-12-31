import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Users, FileText, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname;
    if (path.startsWith('/patients')) return 'patients';
    if (path.startsWith('/templates')) return 'templates';
    if (path.startsWith('/chat')) return 'chat';
    return 'chat'; // Default to chat instead of home
  });

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-chatgpt-sidebar transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-lg`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          {/* Removed ChatGPT label */}
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                to="/chat"
                className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'chat' ? 'bg-chatgpt-hover' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare className="mr-2" />
                Chat
              </Link>
            </li>
            <li>
              <Link
                to="/patients"
                className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'patients' ? 'bg-chatgpt-hover' : ''}`}
                onClick={() => setActiveTab('patients')}
              >
                <Users className="mr-2" />
                Patients
              </Link>
            </li>
            <li>
              <Link
                to="/templates"
                className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'templates' ? 'bg-chatgpt-hover' : ''}`}
                onClick={() => setActiveTab('templates')}
              >
                <FileText className="mr-2" />
                Templates
              </Link>
            </li>
          </ul>
        </nav>
        {/* Settings moved to footer */}
        <div className="mt-auto border-t border-gray-700">
          <Link
            to="/settings"
            className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'settings' ? 'bg-chatgpt-hover' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="mr-2" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;