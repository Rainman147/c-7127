
import { useState } from 'react';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import type { Message, Template } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (content: string, type?: 'text' | 'audio') => Promise<void>;
  onTranscriptionComplete: (text: string) => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
  draftMessage?: string;
  onDraftChange?: (draft: string) => void;
}

const ChatContainer = ({ 
  messages = [], 
  isLoading = false,
  currentChatId,
  onMessageSend = async () => {},
  onTranscriptionComplete = async () => {},
  onTemplateChange = () => {},
  onPatientSelect = async () => {},
  selectedPatientId,
  draftMessage = '',
  onDraftChange
}: ChatContainerProps) => {
  const [transcriptionText, setTranscriptionText] = useState('');

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          currentChatId={currentChatId} 
          onTemplateChange={onTemplateChange}
          onPatientSelect={onPatientSelect}
          selectedPatientId={selectedPatientId}
        />
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full relative">
            <div className="absolute inset-0 overflow-y-auto chat-scrollbar">
              <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8">
                <div className="pt-[60px] pb-[100px]">
                  <MessageList messages={messages} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                isLoading={isLoading}
                draftMessage={draftMessage}
                onDraftChange={onDraftChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
