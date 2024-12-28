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

  const handleSubmit = async (msg: string, type?: 'text' | 'audio') => {
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
          lastRetryTimestamp: new Date().toISOString()
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