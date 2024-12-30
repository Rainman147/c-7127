import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { logger, LogCategory } from "@/utils/logging";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { useState, useEffect } from "react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    handleSubmit: originalHandleSubmit,
    isProcessing
  } = useMessageSubmission({ 
    onSend,
    message,
    setMessage
  });

  const {
    handleTranscriptionComplete,
    handleFileUpload
  } = useTranscriptionHandler({
    onTranscriptionComplete,
    setMessage
  });

  useEffect(() => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'State updated:', {
      messageLength: message.length,
      isProcessing,
      isLoading,
      isSubmitting,
      timestamp: new Date().toISOString()
    });
  }, [message, isProcessing, isLoading, isSubmitting]);

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;

    const submitStartTime = performance.now();
    setIsSubmitting(true);

    logger.info(LogCategory.COMMUNICATION, 'ChatInput', 'Starting submission:', {
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      await originalHandleSubmit();
      
      const submitDuration = performance.now() - submitStartTime;
      logger.info(LogCategory.COMMUNICATION, 'ChatInput', 'Submission complete:', {
        duration: `${submitDuration.toFixed(2)}ms`
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Submission failed:', {
        error,
        duration: `${(performance.now() - submitStartTime).toFixed(2)}ms`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
      logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Enter pressed');
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleMessageChange = (newMessage: string) => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', {
      previousLength: message.length,
      newLength: newMessage.length
    });
    setMessage(newMessage);
  };

  const isDisabled = isLoading || isProcessing || isSubmitting;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
            <ChatInputField
              message={message}
              setMessage={handleMessageChange}
              handleKeyDown={handleKeyDown}
              isLoading={isDisabled}
            />
            <ChatInputActions
              isLoading={isDisabled}
              message={message}
              handleSubmit={handleSubmit}
              onTranscriptionComplete={handleTranscriptionComplete}
              handleFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;