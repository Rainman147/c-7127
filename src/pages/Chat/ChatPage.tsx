import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar isOpen={isSidebarOpen} />
      <ChatContainer 
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={setIsSidebarOpen}
      />
    </div>
  );
};

export default ChatPage;