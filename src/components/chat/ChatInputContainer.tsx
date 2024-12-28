import { useState, useEffect } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import ChatInputField from "./ChatInputField";
import ChatInputActions from "./ChatInputActions";
import { useToast } from "@/hooks/use-toast";
import { useRetryLogic } from "@/hooks/chat/useRetryLogic";
import { useMessageValidation } from "@/hooks/chat/useMessageValidation";
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useQueueMonitor } from '@/hooks/queue/useQueueMonitor';

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
  const { addMessage, processMessages } = useMessageQueue();
  const queueStatus = useQueueMonitor();

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) {
      return;
    }

    try {
      logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Attempting to send message:', {
        length: message.length,
        retryCount
      });

      await onSend(message, 'text');
      setMessage("");
      
      if (retryCount > 0) {
        logger.info(LogCategory.STATE, 'ChatInput', 'Successfully sent message after retries:', {
          attempts: retryCount + 1
        });
        resetRetryCount();
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
        error,
        retryCount: retryCount + 1
      });

      const metadata: ErrorMetadata = {
        component: 'ChatInput',
        severity: 'high',
        timestamp: new Date().toISOString(),
        errorType: 'submission',
        operation: 'send-message',
        additionalInfo: {
          messageLength: message.length,
          retryCount
        }
      };
      
      ErrorTracker.trackError(error as Error, metadata);
      throw error;
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      await handleSubmit();
    }
  };

  const handleMessageChange = async (newMessage: string) => {
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

  // Process queued messages when connection is restored
  useEffect(() => {
    if (queueStatus.pending > 0) {
      processMessages(async (queuedMessage) => {
        await onSend(queuedMessage.content, 'text');
      });
    }
  }, [queueStatus.pending, onSend, processMessages]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
            <ChatInputField
              message={message}
              setMessage={handleMessageChange}
              handleKeyDown={handleKeyDown}
              isLoading={isLoading}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <ChatInputActions
              isLoading={isLoading}
              message={message}
              handleSubmit={handleSubmit}
              onTranscriptionComplete={onTranscriptionComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputContainer;