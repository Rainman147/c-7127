import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { useChatMessages } from '@/features/chat/hooks/useChatMessages';
import { logger, LogCategory } from '@/utils/logging';

export default function Index() {
  const { chatId } = useParams<{ chatId: string }>();
  const { messages, isLoading, sendMessage, loadMessages } = useChatMessages(chatId || '');

  useEffect(() => {
    if (chatId) {
      logger.debug(LogCategory.STATE, 'Index', 'Loading messages for chat:', { chatId });
      loadMessages();
    }
  }, [chatId, loadMessages]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <div className="p-4 border-t">
        <ChatInput 
          onSend={sendMessage}
          isLoading={isLoading}
          onTranscriptionComplete={(text) => {
            logger.debug(LogCategory.COMMUNICATION, 'Index', 'Transcription completed:', { 
              textLength: text.length 
            });
          }}
          onTranscriptionUpdate={(text) => {
            logger.debug(LogCategory.COMMUNICATION, 'Index', 'Transcription updated:', { 
              textLength: text.length 
            });
          }}
        />
      </div>
    </div>
  );
}