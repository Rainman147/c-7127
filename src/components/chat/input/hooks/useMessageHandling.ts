import { useState } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import { useToast } from "@/hooks/use-toast";
import { useRetryLogic } from "@/hooks/chat/useRetryLogic";
import { useMessageValidation } from "@/hooks/chat/useMessageValidation";

interface UseMessageHandlingProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  message: string;
  setMessage: (message: string) => void;
  connectionState: any;
}

export const useMessageHandling = ({
  onSend,
  message,
  setMessage,
  connectionState
}: UseMessageHandlingProps) => {
  const { toast } = useToast();
  const { retryCount, handleRetry, resetRetryCount } = useRetryLogic();
  const { validateMessage, MAX_MESSAGE_LENGTH } = useMessageValidation();
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  const handleMessageChange = async (newMessage: string) => {
    try {
      logger.debug(LogCategory.USER_ACTION, 'ChatInput', 'Message content changed:', {
        oldLength: message.length,
        newLength: newMessage.length,
        timestamp: new Date().toISOString()
      });

      if (newMessage.length > MAX_MESSAGE_LENGTH) {
        logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Message exceeds maximum length:', {
          length: newMessage.length,
          limit: MAX_MESSAGE_LENGTH,
          timestamp: new Date().toISOString()
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
        messageLength: newMessage.length,
        connectionState: connectionState.status,
        timestamp: new Date().toISOString(),
        stackTrace: error instanceof Error ? error.stack : undefined
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

  const handleSubmit = async (msg: string, type?: 'text' | 'audio') => {
    const currentTime = Date.now();
    setLastAttemptTime(currentTime);

    try {
      if (!validateMessage(msg)) {
        logger.warn(LogCategory.VALIDATION, 'ChatInput', 'Message validation failed', {
          messageLength: msg.length,
          timestamp: new Date().toISOString()
        });
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
      }
      
      logger.debug(LogCategory.STATE, 'ChatInput', 'Message sent successfully', {
        timestamp: new Date().toISOString(),
        duration: Date.now() - currentTime
      });
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Error sending message:', {
        error,
        retryCount: retryCount + 1,
        connectionState: connectionState.status,
        timestamp: new Date().toISOString(),
        duration: Date.now() - currentTime,
        stackTrace: error instanceof Error ? error.stack : undefined
      });

      await handleRetry(
        () => handleSubmit(msg, type),
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
          lastRetryTimestamp: new Date().toISOString(),
          timeSinceLastAttempt: Date.now() - lastAttemptTime
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
      throw error;
    }
  };

  return {
    handleMessageChange,
    handleSubmit
  };
};