import { useState } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { ConnectionStatusBar } from "./chat/ConnectionStatusBar";
import { useChatInput } from "@/hooks/chat/useChatInput";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const MAX_MESSAGE_LENGTH = 4000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const ChatInput = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  logger.debug(LogCategory.RENDER, 'ChatInput', 'Rendering with props:', { isLoading });
  
  const [message, setMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const {
    handleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled,
    connectionState
  } = useChatInput({
    onSend: async (msg: string, type?: 'text' | 'audio') => {
      try {
        // Enhanced validation logging
        if (!msg.trim()) {
          logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Empty message rejected');
          return;
        }

        if (msg.length > MAX_MESSAGE_LENGTH) {
          logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Message exceeds length limit:', {
            length: msg.length,
            limit: MAX_MESSAGE_LENGTH
          });
          toast({
            title: "Message too long",
            description: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
            variant: "destructive",
          });
          return;
        }

        // Enhanced connection state logging
        logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Attempting to send message:', {
          length: msg.length,
          type,
          connectionState: connectionState.status,
          retryCount
        });

        await onSend(msg, type);
        
        // Reset retry count on success
        if (retryCount > 0) {
          logger.info(LogCategory.STATE, 'ChatInput', 'Successfully sent message after retries:', {
            attempts: retryCount + 1
          });
          setRetryCount(0);
        }
        
        logger.debug(LogCategory.STATE, 'ChatInput', 'Message sent successfully');
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
          error,
          retryCount: retryCount + 1,
          connectionState: connectionState.status
        });

        // Enhanced retry strategy with better feedback
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          
          const currentRetry = retryCount + 1;
          toast({
            title: connectionState.status === 'disconnected' 
              ? "Connection lost"
              : "Message failed to send",
            description: `Retrying... (${currentRetry}/${MAX_RETRIES})`,
            variant: "destructive",
          });

          // Exponential backoff for retries
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          logger.info(LogCategory.STATE, 'ChatInput', 'Scheduling retry:', {
            attempt: currentRetry,
            delay
          });

          setTimeout(() => {
            handleSubmit();
          }, delay);
        } else {
          const metadata: ErrorMetadata = {
            component: 'ChatInput',
            severity: 'high',
            timestamp: new Date().toISOString(),
            errorType: 'submission',
            operation: 'send-message',
            additionalInfo: {
              messageLength: msg.length,
              messageType: type,
              connectionState: connectionState.status,
              retryCount,
              lastRetryTimestamp: new Date().toISOString()
            }
          };
          ErrorTracker.trackError(error as Error, metadata);
          
          toast({
            title: "Failed to send message",
            description: connectionState.status === 'disconnected'
              ? "Connection lost. Please check your internet connection and try again."
              : "An error occurred. Please try again later.",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    onTranscriptionComplete,
    message,
    setMessage
  });

  const handleMessageChange = (newMessage: string) => {
    try {
      if (newMessage.length > MAX_MESSAGE_LENGTH) {
        logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Message exceeds maximum length:', {
          length: newMessage.length,
          limit: MAX_MESSAGE_LENGTH
        });

        toast({
          title: "Message too long",
          description: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
          variant: "destructive",
        });
        return;
      }
      
      logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', { 
        length: newMessage.length,
        connectionState: connectionState.status
      });
      setMessage(newMessage);
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Error updating message:', {
        error,
        messageLength: newMessage.length,
        connectionState: connectionState.status
      });

      const metadata: ErrorMetadata = {
        component: 'ChatInput',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'state',
        operation: 'update-message',
        additionalInfo: {
          messageLength: newMessage.length,
          retryCount,
          connectionState: connectionState.status
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
    }
  };

  // Enhanced disabled state logic
  const inputDisabled = isDisabled || 
    (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) ||
    isLoading;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          <ConnectionStatusBar connectionState={connectionState} />
          <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
            <ChatInputField
              message={message}
              setMessage={handleMessageChange}
              handleKeyDown={handleKeyDown}
              isLoading={inputDisabled}
            />
            <ChatInputActions
              isLoading={inputDisabled}
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