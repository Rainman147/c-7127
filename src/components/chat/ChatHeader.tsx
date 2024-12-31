import { memo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const ChatHeader = ({ isSidebarOpen, onTemplateChange, currentChatId }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-chatgpt-sidebar">
      <h1 className="text-xl font-bold text-white">ChatGPT</h1>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <span className="text-white">{user.email}</span>
            <Button onClick={signOut} variant="outline" className="text-white">
              Sign Out
            </Button>
          </>
        ) : (
          <Button onClick={() => window.location.href = '/auth'} variant="outline" className="text-white">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default memo(ChatHeader);
