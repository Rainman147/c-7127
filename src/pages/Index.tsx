import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatInput from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { useChat } from '@/hooks/chat/useChat';
import { logger, LogCategory } from '@/utils/logging';

const Index = () => {
  const { chatId } = useParams();
  const { messages, isLoading, sendMessage, loadMessages } = useChat(chatId || null);

  useEffect(() => {
    if (chatId) {
      logger.debug(LogCategory.STATE, 'Index', 'Loading messages for chat:', { chatId });
      loadMessages();
    }
  }, [chatId, loadMessages]);

  return (
    <div className="flex-1 overflow-hidden bg-chatgpt-gray">
      <div className="relative h-full">
        <MessageList messages={messages} />
        <div className="absolute bottom-0 left-0 w-full">
          <ChatInput 
            onSend={sendMessage} 
            isLoading={isLoading}
            onTranscriptionComplete={(text) => {
              logger.debug(LogCategory.COMMUNICATION, 'Index', 'Transcription completed:', { textLength: text.length });
              sendMessage(text, 'audio');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;