import { useState } from "react";
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useChatInput } from "@/hooks/chat/useChatInput";
import ChatInputWrapper from "./ChatInputWrapper";
import { logger, LogCategory } from '@/utils/logging';

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({
  onSend,
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { addMessage, processMessages } = useMessageQueue();

  const {
    handleSubmit: originalHandleSubmit,
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

  const handleMessageChange = (newMessage: string) => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', { 
      length: newMessage.length 
    });
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await onSend(message, 'text');
      setMessage('');
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Failed to send message:', error);
      // Queue message for retry if needed
      addMessage({ content: message, type: 'text' });
    }
  };

  return (
    <ChatInputWrapper
      message={message}
      handleMessageChange={handleMessageChange}
      handleKeyDown={handleKeyDown}
      handleSubmit={originalHandleSubmit}
      handleTranscriptionComplete={handleTranscriptionComplete}
      handleFileUpload={handleFileUpload}
      inputDisabled={isDisabled || isLoading}
    />
  );
};

export default ChatInput;