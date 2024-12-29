import { useParams } from 'react-router-dom';
import ChatInput from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { useChatMessages } from '@/features/chat/hooks/useChatMessages';
import { logger, LogCategory } from '@/utils/logging';

const Index = () => {
  const { chatId } = useParams();
  const { messages, isLoading, sendMessage } = useChatMessages(chatId || '');

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <ChatInput 
        onSend={sendMessage}
        onTranscriptionComplete={(text) => sendMessage(text, 'audio')}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Index;