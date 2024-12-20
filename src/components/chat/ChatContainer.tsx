import { useState, useMemo } from 'react';
import { ChatHeader } from '@/components/ChatHeader';
import ChatInput from '@/components/ChatInput';
import MessageList from '@/components/MessageList';
import type { Template } from '@/components/template/types';

interface ChatContainerProps {
  messages: Array<{ 
    role: 'user' | 'assistant'; 
    content: string; 
    type?: 'text' | 'audio';
    id?: string;
  }>;
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (message: string, type?: 'text' | 'audio') => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onTranscriptionComplete: (text: string) => void;
  isSidebarOpen: boolean;
}

const ChatContainer = ({
  messages,
  isLoading,
  currentChatId,
  onMessageSend,
  onTemplateChange,
  onTranscriptionComplete,
  isSidebarOpen
}: ChatContainerProps) => {
  const previousMessagesLength = useMemo(() => messages.length, [messages.length]);
  
  // Only log when messages array length changes
  if (process.env.NODE_ENV === 'development' && previousMessagesLength !== messages.length) {
    console.log('[ChatContainer] Rendering with messages:', messages.map(m => ({
      role: m.role,
      content: m.content.substring(0, 50) + '...'
    })));
  }
  
  const memoizedHeader = useMemo(() => (
    <ChatHeader 
      isSidebarOpen={isSidebarOpen}
      currentChatId={currentChatId}
      onTemplateChange={onTemplateChange}
    />
  ), [isSidebarOpen, currentChatId, onTemplateChange]);

  const memoizedMessageList = useMemo(() => (
    <MessageList messages={messages} />
  ), [messages]);

  const memoizedChatInput = useMemo(() => (
    <ChatInput 
      onSend={onMessageSend}
      onTranscriptionComplete={onTranscriptionComplete}
      isLoading={isLoading} 
    />
  ), [onMessageSend, onTranscriptionComplete, isLoading]);

  return (
    <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
      {memoizedHeader}
      
      <div className={`flex h-full flex-col ${messages.length === 0 ? 'items-center justify-center' : 'justify-between'} pt-[60px] pb-4`}>
        {messages.length === 0 ? (
          <div className="w-full max-w-3xl px-4 space-y-4">
            <div>
              <h1 className="mb-8 text-4xl font-semibold text-center">What can I help with?</h1>
              {memoizedChatInput}
            </div>
          </div>
        ) : (
          <>
            {memoizedMessageList}
            <div className="w-full max-w-3xl mx-auto px-4 py-2">
              {memoizedChatInput}
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