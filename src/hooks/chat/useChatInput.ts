import { useState } from "react";
import { useRealTime } from "@/contexts/RealTimeContext";
import { useMessageSubmission } from "@/hooks/chat/useMessageSubmission";
import { useTranscriptionHandler } from "@/hooks/chat/useTranscriptionHandler";
import { logger, LogCategory } from "@/utils/logging";

interface UseChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  setMessage: (message: string) => void;
  message: string;
}

export const useChatInput = ({ 
  onSend, 
  onTranscriptionComplete, 
  message,
  setMessage 
}: UseChatInputProps) => {
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
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      logger.debug(LogCategory.COMMUNICATION, 'ChatInput', 'Enter key pressed, submitting message');
      e.preventDefault();
      await handleSubmit();
    }
  };

  const isDisabled = isProcessing || connectionState.status === 'disconnected';

  return {
    handleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled,
    connectionState
  };
};