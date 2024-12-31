import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage, 
    loadChatMessages,
    handleTemplateChange 
  } = useChat();

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar isOpen={isSidebarOpen} />
      <ChatContainer 
        messages={messages}
        isLoading={isLoading}
        currentChatId={currentChatId}
        onMessageSend={handleSendMessage}
        onTemplateChange={handleTemplateChange}
        onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
        isSidebarOpen={isSidebarOpen}
        onSidebarOpenChange={setIsSidebarOpen}
      />
    </div>
  );
};

export default ChatPage;