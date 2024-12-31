import { useState } from 'react';
import MessageList from '@/components/chat/MessageList';
import ChatInput from '@/components/ChatInput';
import type { Template } from '@/components/template/types';
import type { Message } from '@/types/chat';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (message: string, type?: 'text' | 'audio') => Promise<void>;
  onTranscriptionComplete: (text: string) => void;
  isSidebarOpen: boolean;
}

const ChatContainer = ({
  messages,
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  isSidebarOpen,
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages);
  
  return (
    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>      
      <div className={`flex h-full flex-col ${messages.length === 0 ? 'items-center justify-center' : 'justify-between'} pt-[60px] pb-4`}>
        {messages.length === 0 ? (
          <div className="w-full max-w-3xl px-4 space-y-4">
            <div>
              <h1 className="mb-8 text-4xl font-semibold text-center">What can I help with?</h1>
              <ChatInput 
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                isLoading={isLoading} 
              />
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div className="w-full max-w-3xl mx-auto px-4 py-2">
              <ChatInput 
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                isLoading={isLoading} 
              />
            </div>
            <div className="text-xs text-center text-gray-500 py-2">
              ChatGPT can make mistakes. Check important info.
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default ChatContainer;