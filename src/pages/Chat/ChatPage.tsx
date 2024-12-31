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

  const handleSessionSelect = async (sessionId: string) => {
    console.log('[ChatPage] Session selected:', sessionId);
    await loadChatMessages(sessionId);
  };

  return (
    <div className="flex h-screen bg-chatgpt-main">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSessionSelect={handleSessionSelect}
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