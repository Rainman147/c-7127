import { Menu, Plus, Search } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
      <Button 
        variant="sidebarHeader"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {isSidebarOpen && (
        <Button
          variant="sidebarHeader"
          aria-label="Search chats"
        >
          <Search className="h-5 w-5" />
        </Button>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="sidebarHeader"
              onClick={handleNewChat}
              aria-label="New session"
            >
              <Plus className="h-5 w-5" />
            </Button>
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