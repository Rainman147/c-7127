import { useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import type { Message, Template } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string;
  onMessageSend: (content: string, type?: 'text' | 'audio', systemInstructions?: string) => Promise<void>;
  onTranscriptionComplete: (text: string) => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
}

const ChatContainer = ({ 
  messages, 
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages);
  const { isSidebarOpen } = useUI();
  const { currentTemplate } = useTemplate();
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  const handleMessageSend = async (
    content: string,
    type: 'text' | 'audio' = 'text',
    systemInstructions?: string
  ) => {
    console.log('[ChatContainer] Sending message with system instructions:', 
      systemInstructions ? 'Present' : 'Not provided');
    await onMessageSend(content, type, systemInstructions);
  };

  return (
    <div className={`relative flex h-full w-full flex-1 flex-col items-center justify-between bg-chatgpt-main transition-all duration-300 ${
      isSidebarOpen ? 'ml-64' : 'ml-0'
    }`}>
      <ChatHeader 
        currentChatId={currentChatId} 
        onTemplateChange={onTemplateChange}
        onPatientSelect={onPatientSelect}
        selectedPatientId={selectedPatientId}
      />
      <div className="flex-1 w-full overflow-hidden pt-[60px] pb-[100px]">
        <MessageList messages={messages} />
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
        <ChatInput
          onSend={handleMessageSend}
          onTranscriptionComplete={onTranscriptionComplete}
          onTranscriptionUpdate={handleTranscriptionUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatContainer;