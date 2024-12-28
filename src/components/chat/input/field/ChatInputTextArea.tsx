import React, { useRef, useEffect } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import { toast } from "@/hooks/use-toast";

interface ChatInputTextAreaProps {
  message: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  isLoading: boolean;
  maxLength: number;
  isInvalid: boolean;
  tooltipId?: string;
  className?: string;
}

export const ChatInputTextArea = ({
  message,
  onChange,
  onKeyDown,
  placeholder,
  isLoading,
  maxLength,
  isInvalid,
  tooltipId,
  className = ""
}: ChatInputTextAreaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    try {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = `${newHeight}px`;
        logger.debug(LogCategory.STATE, 'ChatInputTextArea', 'Adjusted height:', { 
          newHeight,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInputTextArea', 'Error adjusting textarea height:', {
        error,
        timestamp: new Date().toISOString()
      });
      ErrorTracker.trackError(error as Error, {
        component: 'ChatInputTextArea',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'ui-adjustment',
        additionalInfo: {
          action: 'adjust-height',
          messageLength: message.length
        }
      });
    }
  };

  useEffect(() => {
    logger.debug(LogCategory.STATE, 'ChatInputTextArea', 'Message changed, adjusting height');
    adjustTextareaHeight();
  }, [message]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={message}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      aria-label="Chat message input"
      aria-invalid={isInvalid}
      aria-describedby={tooltipId}
      className={`w-full min-h-[40px] max-h-[200px] resize-none bg-transparent px-4 py-3 focus:outline-none overflow-y-auto transition-all duration-150 ease-in-out chat-input-scrollbar ${
        isLoading ? 'cursor-not-allowed opacity-50' : ''
      } ${isInvalid ? 'border-red-500' : ''} ${className}`}
      disabled={isLoading}
    />
  );
};