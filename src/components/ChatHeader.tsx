import { Button } from '@/components/ui/button';
import { Menu, Plus } from 'lucide-react';
import type { Template } from '@/components/template/types';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
  onNewChat?: () => void;
  onToggleSidebar: () => void;
}

export const ChatHeader = ({ 
  isSidebarOpen,
  currentChatId,
  onTemplateChange,
  onNewChat,
  onToggleSidebar
}: ChatHeaderProps) => {
  return (
    <header className="fixed top-0 z-50 w-full bg-background border-b">
      <div className="flex h-14 items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="shrink-0"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Chat</span>
          </Button>
        </div>
      </div>
    </header>
  );
};