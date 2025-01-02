import { useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import type { Message } from '@/types/chat';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string;
  onMessageSend: (content: string, type?: 'text' | 'audio', systemInstructions?: string) => Promise<void>;
  onTranscriptionComplete: (text: string) => Promise<void>;
  onTemplateChange: (template: any) => void;
}

const ChatContainer = ({ 
  messages, 
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  onTemplateChange
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages);
  const { isSidebarOpen } = useUI();
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  return (
    <div className="relative flex h-full w-full flex-1 flex-col items-center justify-between bg-chatgpt-main">
      <ChatHeader 
        currentChatId={currentChatId} 
        onTemplateChange={onTemplateChange}
      />
      <div className="flex-1 w-full overflow-hidden pt-[60px] pb-[100px]">
        <MessageList messages={messages} />
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
        <ChatInput
          onSend={onMessageSend}
          onTranscriptionComplete={onTranscriptionComplete}
          onTranscriptionUpdate={handleTranscriptionUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatContainer;