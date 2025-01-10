import { useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import type { Message, Template } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
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
  console.log('[ChatContainer] Rendering with messages:', messages, 'currentChatId:', currentChatId);
  const { isSidebarOpen } = useUI();
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  return (
    <div className="flex h-screen w-full">
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <ChatHeader 
          currentChatId={currentChatId} 
          onTemplateChange={onTemplateChange}
          onPatientSelect={onPatientSelect}
          selectedPatientId={selectedPatientId}
        />
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 pt-[60px] pb-[100px]">
            <MessageList messages={messages} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
          <ChatInput
            onSend={onMessageSend}
            onTranscriptionComplete={onTranscriptionComplete}
            onTranscriptionUpdate={handleTranscriptionUpdate}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;