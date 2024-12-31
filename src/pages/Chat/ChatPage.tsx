import ChatContainer from '@/features/chat/components/ChatContainer';
import { useChat } from '@/hooks/useChat';
import { useUI } from '@/contexts/UIContext';

const ChatPage = () => {
  const { 
    messages, 
    isLoading, 
    currentChatId, 
    handleSendMessage,
    loadChatMessages
  } = useChat();

  const { isSidebarOpen } = useUI();

  return (
    <ChatContainer 
      messages={messages}
      isLoading={isLoading}
      currentChatId={currentChatId}
      onMessageSend={handleSendMessage}
      onTranscriptionComplete={(text) => handleSendMessage(text, 'audio')}
      isSidebarOpen={isSidebarOpen}
    />
  );
};

export default ChatPage;