import { useState, useEffect } from "react";
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useQueueMonitor } from '@/hooks/queue/useQueueMonitor';
import { useChatInput } from "@/hooks/chat/useChatInput";
import { useMessageHandling } from "./hooks/useMessageHandling";
import ChatInputWrapper from "./ChatInputWrapper";

interface ChatInputContainerProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInputContainer = ({
  onSend,
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false
}: ChatInputContainerProps) => {
  const [message, setMessage] = useState("");
  const { addMessage, processMessages } = useMessageQueue();
  const queueStatus = useQueueMonitor();

  const {
    handleSubmit: originalHandleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled,
    connectionState
  } = useChatInput({
    onSend,
    onTranscriptionComplete,
    message,
    setMessage,
    onTranscriptionUpdate
  });

  const { handleMessageChange, handleSubmit } = useMessageHandling({
    onSend,
    message,
    setMessage,
    connectionState
  });

  // Process queued messages when connection is available
  useEffect(() => {
    if (connectionState.status === 'connected' && queueStatus.pending > 0) {
      processMessages(async (queuedMessage) => {
        await onSend(queuedMessage.content, 'text');
      });
    }
  }, [connectionState.status, queueStatus.pending, onSend, processMessages]);

  const inputDisabled = isDisabled || 
    (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) ||
    isLoading;

  return (
    <ChatInputWrapper
      message={message}
      handleMessageChange={handleMessageChange}
      handleKeyDown={handleKeyDown}
      handleSubmit={originalHandleSubmit}
      handleTranscriptionComplete={handleTranscriptionComplete}
      handleFileUpload={handleFileUpload}
      inputDisabled={inputDisabled}
      connectionState={connectionState}
    />
  );
};

export default ChatInputContainer;