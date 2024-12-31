import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, MessageSquare, Settings } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-chatgpt-sidebar transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-lg`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-white">ChatGPT</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'home' ? 'bg-chatgpt-hover' : ''}`}
                onClick={() => setActiveTab('home')}
              >
                <Home className="mr-2" />
                Home
              </Link>
            </li>
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
                to="/settings"
                className={`flex items-center p-4 text-white hover:bg-chatgpt-hover ${activeTab === 'settings' ? 'bg-chatgpt-hover' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="mr-2" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;