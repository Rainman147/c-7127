import React, { memo } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ChatInputTextArea } from "./field/ChatInputTextArea";
import { CharacterCount } from "./field/CharacterCount";
import { useConnectionStatus } from "./field/useConnectionStatus";

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
  const { connectionState, getPlaceholder, getInputTooltip } = useConnectionStatus();

  logger.debug(LogCategory.RENDER, 'ChatInputField', 'Rendering with:', { 
    messageLength: message.length, 
    isLoading,
    timestamp: new Date().toISOString()
  });

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
  };

  const tooltipContent = getInputTooltip();
  const isInvalid = message.length > maxLength;

  return (
    <div className="w-full">
      <Tooltip content={tooltipContent} open={tooltipContent ? undefined : false}>
        <ChatInputTextArea
          message={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          isLoading={isLoading}
          maxLength={maxLength}
          isInvalid={isInvalid}
          tooltipId={tooltipContent ? "connection-status" : undefined}
          className={connectionState.status !== 'connected' ? 'text-gray-500' : ''}
        />
      </Tooltip>
      <CharacterCount current={message.length} max={maxLength} />
    </div>
  );
});

ChatInputField.displayName = 'ChatInputField';

export default ChatInputField;