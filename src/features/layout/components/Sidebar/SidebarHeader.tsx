import { Menu, Plus, Search } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { useNavigate } from 'react-router-dom';

const SidebarHeader = () => {
  const { toggleSidebar, isSidebarOpen } = useUI();
  const navigate = useNavigate();

  const handleNewChat = () => {
    console.log('[SidebarHeader] Creating new chat');
    navigate('/');
  };

  return (
    <div className="flex justify-between items-center h-[60px] px-2">
      <button 
        onClick={toggleSidebar} 
        className="h-10 rounded-lg px-2 text-token-text-secondary hover:text-gray-300 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      {isSidebarOpen && (
        <button
          className="h-10 rounded-lg px-2 text-token-text-secondary hover:text-gray-300 transition-colors"
          aria-label="Search chats"
        >
          <Search className="h-5 w-5" />
        </button>
      )}
      
      <button
        onClick={handleNewChat}
        className="flex items-center gap-2 px-2 py-1 text-sm text-gray-300 hover:text-white transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>
    </div>
  );
};

export default SidebarHeader;