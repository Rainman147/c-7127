import React, { useState } from "react";
import { useMessageQueue } from '@/hooks/queue/useMessageQueue';
import { useChatInput } from "@/hooks/chat/useChatInput";
import { logger, LogCategory } from '@/utils/logging';
import { Button } from "./ui/button";
import { Send, Loader2 } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import FileUploader from "./audio/FileUploader";
import { Tooltip } from "./ui/tooltip";
import ChatInputField from "./ChatInputField";
import type { ChatInputProps } from "@/types/chat";

const ChatInput = ({
  onSend,
  onTranscriptionComplete,
  isLoading = false
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { addMessage } = useMessageQueue();

  const {
    handleSubmit: originalHandleSubmit,
    handleKeyDown,
    handleTranscriptionComplete,
    handleFileUpload,
    isDisabled
  } = useChatInput({
    onSend,
    onTranscriptionComplete,
    message,
    setMessage
  });

  const handleMessageChange = (newMessage: string) => {
    logger.debug(LogCategory.STATE, 'ChatInput', 'Message changed:', { 
      length: newMessage.length 
    });
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await onSend(message, 'text');
      setMessage('');
    } catch (error) {
      logger.error(LogCategory.ERROR, 'ChatInput', 'Failed to send message:', error);
      addMessage({ content: message, type: 'text' });
    }
  };

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
            />
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                <FileUploader onFileSelected={handleFileUpload} />
              </div>
              <Tooltip content={
                isLoading ? "Sending message..." : 
                !message.trim() ? "Please enter a message" : 
                "Send message"
              }>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !message.trim()}
                  className={`transition-all duration-200 ${
                    !message.trim() ? 'opacity-50' : ''
                  }`}
                  size="icon"
                  variant="ghost"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;