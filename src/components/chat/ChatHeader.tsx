import { memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const ChatHeader = ({ isSidebarOpen, onTemplateChange, currentChatId }) => {
  const { signOut } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-chatgpt-sidebar">
      <h1 className="text-xl font-bold text-white">ChatGPT</h1>
      <div className="flex items-center space-x-4">
        <Button onClick={signOut} variant="outline" className="text-white">
          Sign Out
        </Button>
      </div>
    </header>
  );
};

export default memo(ChatHeader);