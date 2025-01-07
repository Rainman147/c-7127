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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={toggleSidebar} 
              className="h-10 rounded-lg px-2 text-gray-300 hover:text-white hover:bg-chatgpt-hover/45 transition-all duration-200"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isSidebarOpen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-10 rounded-lg px-2 text-gray-300 hover:text-white hover:bg-chatgpt-hover/45 transition-all duration-200"
                aria-label="Search sessions"
              >
                <Search className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search Sessions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleNewChat}
              className="h-10 rounded-lg px-2 text-gray-300 hover:text-white hover:bg-chatgpt-hover/45 transition-all duration-200"
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