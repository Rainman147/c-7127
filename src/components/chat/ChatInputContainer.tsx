import { useState } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import ChatInputField from "./ChatInputField";
import ChatInputActions from "./ChatInputActions";
import { ConnectionStatusBar } from "./ConnectionStatusBar";
import { useChatInput } from "@/hooks/chat/useChatInput";
import { useToast } from "@/hooks/use-toast";
import { useRetryLogic } from "@/hooks/chat/useRetryLogic";
import { useMessageValidation } from "@/hooks/chat/useMessageValidation";

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
  const { toast } = useToast();
  const { retryCount, handleRetry, resetRetryCount } = useRetryLogic();
  const { validateMessage, MAX_MESSAGE_LENGTH } = useMessageValidation();

  const {
    handleSubmit: originalHandleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled,
    connectionState
  } = useChatInput({
    onSend: async (msg: string, type?: 'text' | 'audio') => {
      try {
        if (!validateMessage(msg)) {
          return;
        }

        logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Attempting to send message:', {
          length: msg.length,
          type,
          connectionState: connectionState.status,
          retryCount
        });

        await onSend(msg, type);
        
        if (retryCount > 0) {
          logger.info(LogCategory.STATE, 'ChatInput', 'Successfully sent message after retries:', {
            attempts: retryCount + 1
          });
          resetRetryCount();
        }
        
        logger.debug(LogCategory.STATE, 'ChatInput', 'Message sent successfully');
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
          error,
          retryCount: retryCount + 1,
          connectionState: connectionState.status
        });

        await handleRetry(
          () => originalHandleSubmit(),
          connectionState.status
        );

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
              handleSubmit={originalHandleSubmit}
              onTranscriptionComplete={handleTranscriptionComplete}
              handleFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputContainer;