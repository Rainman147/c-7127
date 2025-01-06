import { Menu, Plus, Search } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleNewChat}
              className="h-10 w-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-chatgpt-hover transition-all duration-200"
              aria-label="New session"
            >
              <Plus className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>New Session</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SidebarHeader;