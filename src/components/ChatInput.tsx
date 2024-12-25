import { useState } from "react";
import { logger, LogCategory } from "@/utils/logging";
import { ErrorTracker } from "@/utils/errorTracking";
import type { ErrorMetadata } from "@/types/errorTracking";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";
import { ConnectionStatusBar } from "./chat/ConnectionStatusBar";
import { useChatInput } from "@/hooks/chat/useChatInput";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  logger.debug(LogCategory.RENDER, 'ChatInput', 'Rendering with props:', { isLoading });
  
  const [message, setMessage] = useState("");

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
        await onSend(msg, type);
      } catch (error) {
        const metadata: ErrorMetadata = {
          component: 'ChatInput',
          severity: 'high',
          timestamp: new Date().toISOString(),
          errorType: 'submission',
          operation: 'send-message',
          additionalInfo: {
            messageLength: msg.length,
            messageType: type,
            connectionState: connectionState.status
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
      if (newMessage.length > 4000) {
        const error = new Error('Message exceeds maximum length');
        const metadata: ErrorMetadata = {
          component: 'ChatInput',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          errorType: 'validation',
          operation: 'message-update',
          additionalInfo: {
            messageLength: newMessage.length,
            maxLength: 4000
          }
        };
        ErrorTracker.trackError(error, metadata);
        return;
      }
      
      logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', { 
        length: newMessage.length,
        connectionState: connectionState.status
      });
      setMessage(newMessage);
    } catch (error) {
      const metadata: ErrorMetadata = {
        component: 'ChatInput',
        severity: 'low',
        timestamp: new Date().toISOString(),
        errorType: 'state',
        operation: 'update-message',
        additionalInfo: {
          messageLength: newMessage.length
        }
      };
      ErrorTracker.trackError(error as Error, metadata);
    }
  };

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
              isLoading={isDisabled || isLoading}
            />
            <ChatInputActions
              isLoading={isDisabled || isLoading}
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