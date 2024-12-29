import { useParams } from 'react-router-dom';
import ChatInput from '@/components/ChatInput';
import MessageList from '@/components/MessageList';
import { useChatMessages } from '@/features/chat/hooks/useChatMessages';
import { logger, LogCategory } from '@/utils/logging';

const Index = () => {
  const { chatId } = useParams();
  const { messages, sendMessage, isLoading } = useChatMessages(chatId || null);

  logger.debug(LogCategory.RENDER, 'Index', 'Rendering with:', {
    chatId,
    messageCount: messages.length,
    isLoading
  });

  const handleSendMessage = async (content: string, type: 'text' | 'audio' = 'text') => {
    if (!chatId) return;
    await sendMessage(content, type);
  };

  const handleTranscriptionComplete = (text: string) => {
    if (text.trim()) {
      handleSendMessage(text, 'audio');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-hidden relative">
        <MessageList messages={messages} />
      </div>
      <ChatInput
        onSend={handleSendMessage}
        onTranscriptionComplete={handleTranscriptionComplete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Index;