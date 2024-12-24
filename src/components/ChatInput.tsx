import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { logger, LogCategory } from "@/utils/logging";
import { useRealTime } from "@/contexts/RealTimeContext";
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
  logger.debug(LogCategory.RENDER, 'ChatInput', 'Rendering with props:', { isLoading });
  
  const [message, setMessage] = useState("");
  const { connectionState } = useRealTime();
  
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
    logger.info(LogCategory.COMMUNICATION, 'ChatInput', 'Handling submit with message:', { 
      messageLength: message.length, 
      connectionState,
      isOptimistic: connectionState.status === 'disconnected'
    });
    
    if (message.trim()) {
      try {
        await originalHandleSubmit();
        logger.debug(LogCategory.STATE, 'ChatInput', 'Message submitted successfully');
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error submitting message:', {
          error,
          connectionState,
          messageLength: message.length
        });
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
      logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Enter key pressed, submitting message');
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleMessageChange = (newMessage: string) => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', { 
      length: newMessage.length,
      connectionState: connectionState.status
    });
    setMessage(newMessage);
  };

  const isDisabled = isLoading || isProcessing || connectionState.status === 'disconnected';
  logger.debug(LogCategory.STATE, 'ChatInput', 'Component state:', { 
    isDisabled, 
    messageLength: message.length, 
    connectionState,
    retryCount: connectionState.retryCount
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          {connectionState.status === 'disconnected' && (
            <div className="absolute -top-8 left-0 right-0">
              <div className="bg-red-500/10 text-red-500 text-sm py-1 px-3 rounded-md text-center">
                Connection lost. Messages will be sent when reconnected. (Attempt {connectionState.retryCount})
              </div>
            </div>
          )}
          {connectionState.status === 'connecting' && (
            <div className="absolute -top-8 left-0 right-0">
              <div className="bg-yellow-500/10 text-yellow-500 text-sm py-1 px-3 rounded-md text-center">
                Reconnecting... (Attempt {connectionState.retryCount})
              </div>
            </div>
          )}
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