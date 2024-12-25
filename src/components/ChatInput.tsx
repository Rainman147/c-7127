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
        // Validate message content
        if (!msg.trim()) {
          logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Empty message rejected');
          return;
        }

        if (msg.length > MAX_MESSAGE_LENGTH) {
          toast({
            title: "Message too long",
            description: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
            variant: "destructive",
          });
          return;
        }

        logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Sending message:', {
          length: msg.length,
          type,
          connectionState: connectionState.status
        });

        await onSend(msg, type);
        setRetryCount(0);
        
        logger.debug(LogCategory.STATE, 'ChatInput', 'Message sent successfully');
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
          error,
          retryCount: retryCount + 1
        });

        // Implement retry strategy
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          toast({
            title: "Message failed to send",
            description: `Retrying... (${retryCount + 1}/${MAX_RETRIES})`,
            variant: "destructive",
          });

          // Retry after delay
          setTimeout(() => {
            handleSubmit();
          }, RETRY_DELAY);
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
            description: "Please try again later",
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
          length: newMessage.length
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
        messageLength: newMessage.length
      });

      const metadata: ErrorMetadata = {
        component: 'ChatInput',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'state',
        operation: 'update-message',
        additionalInfo: {
          messageLength: newMessage.length,
          retryCount
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
    }
  };

  // Only disable input when explicitly loading or disconnected with max retries
  const inputDisabled = isDisabled || 
    (connectionState.status === 'disconnected' && connectionState.retryCount >= 5);

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