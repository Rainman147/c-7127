import { useState } from 'react';
import { useUI } from '@/contexts/UIContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  error?: Error | null;
}

const ChatContainer = ({ 
  messages, 
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId,
  error
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages, 'currentChatId:', currentChatId);
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
        
        {error && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {/* Messages Container - Takes remaining height with overflow */}
        <div className="flex-1 overflow-hidden">
          {/* Scrollable Area with Padding Space */}
          <div className="h-full relative">
            {/* Content Container */}
            <div className="absolute inset-0 overflow-y-auto chat-scrollbar">
              {/* Message Width Container */}
              <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8">
                <div className="pt-[60px] pb-[100px]">
                  <MessageList 
                    messages={messages} 
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section - Fixed at bottom */}
        <div className="relative w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;