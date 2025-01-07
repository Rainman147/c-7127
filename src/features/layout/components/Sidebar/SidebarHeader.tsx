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
    <div className="flex items-center">
      <Button 
        variant="sidebarHeader"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu />
      </Button>
      
      {isSidebarOpen && (
        <Button
          variant="sidebarHeader"
          aria-label="Search chats"
        >
          <Search />
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
              <Plus />
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