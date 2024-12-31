import { useState } from 'react';
import Sidebar from '@/features/layout/components/Sidebar';
import ChatContainer from '@/features/chat/components/ChatContainer';
import { useChat } from '@/hooks/useChat';

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage,
    loadChatMessages
  } = useChat();

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={handleSidebarToggle}
      />
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        currentChatId={currentChatId}
        onMessageSend={handleSendMessage}
        onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
};

export default ChatPage;