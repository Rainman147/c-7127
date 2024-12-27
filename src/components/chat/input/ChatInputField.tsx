import React, { useEffect, useRef, memo } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { useRealTime } from "@/contexts/RealTimeContext";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ChatInputFieldProps {
  message: string;
  setMessage: (message: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  maxLength: number;
}

const ChatInputField = memo(({ 
  message, 
  setMessage, 
  handleKeyDown,
  isLoading,
  maxLength 
}: ChatInputFieldProps) => {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { connectionState } = useRealTime();

  logger.debug(LogCategory.RENDER, 'ChatInputField', 'Rendering with:', { 
    messageLength: message.length, 
    isLoading,
    timestamp: new Date().toISOString()
  });

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
      logger.debug(LogCategory.STATE, 'ChatInputField', 'Adjusted height:', { 
        newHeight,
        timestamp: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    logger.debug(LogCategory.STATE, 'ChatInputField', 'Message changed, adjusting height');
    adjustTextareaHeight();
  }, [message]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length > maxLength) {
      logger.warn(LogCategory.VALIDATION, 'ChatInputField', 'Message exceeds length limit:', {
        length: newMessage.length,
        limit: maxLength,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Message too long",
        description: `Messages cannot exceed ${maxLength} characters`,
        variant: "destructive",
      });
      return;
    }
    setMessage(newMessage);
    adjustTextareaHeight();
  };

  const getPlaceholder = () => {
    if (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) {
      return 'Connection lost. Please refresh the page...';
    }
    if (connectionState.status === 'disconnected') {
      return 'Connection lost. Messages will be sent when reconnected...';
    }
    if (connectionState.status === 'connecting') {
      return 'Reconnecting...';
    }
    return 'Message DocTation';
  };

  const getInputTooltip = () => {
    if (connectionState.status === 'disconnected' && connectionState.retryCount >= 5) {
      return 'Please refresh the page to reconnect';
    }
    if (connectionState.status === 'disconnected') {
      return 'Messages will be queued and sent when connection is restored';
    }
    if (connectionState.status === 'connecting') {
      return 'Attempting to reconnect to chat service';
    }
    return '';
  };

  const tooltipContent = getInputTooltip();

  return (
    <div className="w-full">
      <Tooltip content={tooltipContent} open={tooltipContent ? undefined : false}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          maxLength={maxLength}
          aria-label="Chat message input"
          aria-invalid={message.length > maxLength}
          aria-describedby={tooltipContent ? "connection-status" : undefined}
          className={`w-full min-h-[40px] max-h-[200px] resize-none bg-transparent px-4 py-3 focus:outline-none overflow-y-auto transition-all duration-150 ease-in-out chat-input-scrollbar ${
            isLoading ? 'cursor-not-allowed opacity-50' : ''
          } ${connectionState.status !== 'connected' ? 'text-gray-500' : ''}`}
          disabled={isLoading}
        />
      </Tooltip>
      <div 
        className="text-xs text-gray-400 px-4 text-right"
        aria-live="polite"
      >
        {message.length}/{maxLength}
      </div>
    </div>
  );
});

ChatInputField.displayName = 'ChatInputField';

export default ChatInputField;