import { useState } from "react";
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useQueueMonitor } from '@/hooks/queue/useQueueMonitor';
import { useChatInput } from "@/hooks/chat/useChatInput";
import { useMessageHandling } from "@/hooks/chat/useMessageHandling";
import { useRealTime } from "@/contexts/RealTimeContext";
import ChatInputWrapper from "./ChatInputWrapper";
import type { ChatInputContainerProps } from "@/types/chat";

const ChatInputContainer = ({
  onSend,
  onTranscriptionComplete,
  isLoading = false
}: ChatInputContainerProps) => {
  const [message, setMessage] = useState("");
  const { addMessage, processMessages } = useMessageQueue();
  const queueStatus = useQueueMonitor();
  const { connectionState } = useRealTime();

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
    setMessage,
    connectionState
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
      connectionState={connectionState}
    />
  );
};

export default ChatInputContainer;