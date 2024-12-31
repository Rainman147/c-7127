import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useChatSessions } from '@/hooks/useChatSessions';

const SidebarNav = () => {
  const { createSession } = useChatSessions();

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      console.log('New chat session created:', sessionId);
    }
  };

  return (
    <div className="mb-4">
      <Button
        onClick={handleNewChat}
        className="w-full flex items-center gap-2 bg-[#2F2F2F] hover:bg-[#404040] rounded-xl"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
    </div>
  );
};

export default SidebarNav;