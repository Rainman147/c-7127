import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { logger, LogCategory } from "@/utils/logging";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { useState } from "react";

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
  logger.debug(LogCategory.RENDER, 'ChatInput', 'Rendering with props:', { 
    isLoading,
    hasTranscriptionUpdate: !!onTranscriptionUpdate,
    timestamp: new Date().toISOString()
  });
  
  const [message, setMessage] = useState("");
  
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

  const handleSubmit = async () => {
    const submitStartTime = performance.now();
    logger.info(LogCategory.COMMUNICATION, 'ChatInput', 'Starting message submission:', {
      messageLength: message.length,
      isProcessing,
      isLoading,
      timestamp: new Date().toISOString(),
      flowId: `submit-${Date.now()}`
    });
    
    if (message.trim()) {
      try {
        logger.debug(LogCategory.STATE, 'ChatInput', 'Pre-submission state:', {
          message: message.substring(0, 50),
          isProcessing,
          isLoading,
          timestamp: new Date().toISOString()
        });

        await originalHandleSubmit();

        const submitDuration = performance.now() - submitStartTime;
        logger.info(LogCategory.COMMUNICATION, 'ChatInput', 'Message submission completed:', {
          duration: `${submitDuration.toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error submitting message:', {
          error,
          stack: error.stack,
          messageLength: message.length,
          duration: `${(performance.now() - submitStartTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
      logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Enter key pressed, submitting message:', {
        timestamp: new Date().toISOString()
      });
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleMessageChange = (newMessage: string) => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', {
      previousLength: message.length,
      newLength: newMessage.length,
      timestamp: new Date().toISOString()
    });
    setMessage(newMessage);
  };

  const isDisabled = isLoading || isProcessing;
  logger.debug(LogCategory.STATE, 'ChatInput', 'Component state update:', {
    isDisabled,
    messageLength: message.length,
    timestamp: new Date().toISOString()
  });

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