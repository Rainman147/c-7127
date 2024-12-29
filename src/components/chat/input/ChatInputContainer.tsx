import React, { useState } from 'react';
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useQueueMonitor } from '@/hooks/queue/useQueueMonitor';
import { useChatInput } from "@/hooks/chat/useChatInput";
import { useMessageHandling } from "@/hooks/chat/useMessageHandling";
import ChatInputWrapper from "./ChatInputWrapper";
import type { Message } from '@/types/chat';

interface ChatInputContainerProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<Message>;
  onTranscriptionComplete: (text: string) => void;
  isLoading?: boolean;
}

const ChatInputContainer = ({
  onSend,
  onTranscriptionComplete,
  isLoading = false
}: ChatInputContainerProps) => {
  const [message, setMessage] = useState("");
  const { addMessage, processMessages } = useMessageQueue();
  const queueStatus = useQueueMonitor();

  const {
    handleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled
  } = useChatInput({
    onSend,
    onTranscriptionComplete,
    message,
    setMessage
  });

  const { handleMessageChange } = useMessageHandling({
    onSend,
    message,
    setMessage
  });

  const inputDisabled = isDisabled || isLoading;

  return (
    <ChatInputWrapper
      message={message}
      handleMessageChange={handleMessageChange}
      handleKeyDown={handleKeyDown}
      handleSubmit={handleSubmit}
      handleTranscriptionComplete={handleTranscriptionComplete}
      handleFileUpload={handleFileUpload}
      inputDisabled={inputDisabled}
    />
  );
};

export default ChatInputContainer;