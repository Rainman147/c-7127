import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
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

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar isOpen={isSidebarOpen} />
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