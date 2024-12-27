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
          retryCount,
          timestamp: new Date().toISOString()
        });

        await onSend(msg, type);
        
        if (retryCount > 0) {
          logger.info(LogCategory.STATE, 'ChatInput', 'Successfully sent message after retries:', {
            attempts: retryCount + 1,
            timestamp: new Date().toISOString()
          });
          resetRetryCount();
          toast({
            title: "Message Sent",
            description: "Your message was successfully delivered after retrying.",
            variant: "default",
          });
        }
      } catch (error) {
        logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
          error,
          retryCount: retryCount + 1,
          connectionState: connectionState.status,
          timestamp: new Date().toISOString()
        });

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
          title: "Failed to Send Message",
          description: "There was an error sending your message. Retrying...",
          variant: "destructive",
        });

        await handleRetry(
          () => originalHandleSubmit(),
          connectionState.status
        );
      }
    },
    onTranscriptionComplete,
    message,
    setMessage
  });

  const inputDisabled = isDisabled || 
    (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) ||
    isLoading;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4"
      role="region"
      aria-label="Chat input area"
    >
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          <ConnectionStatusBar connectionState={connectionState} />
          <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
            <ChatInputField
              message={message}
              setMessage={setMessage}
              handleKeyDown={handleKeyDown}
              isLoading={inputDisabled}
              maxLength={MAX_MESSAGE_LENGTH}
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