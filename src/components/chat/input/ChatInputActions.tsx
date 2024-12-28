import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import AudioRecorder from "@/components/AudioRecorder";
import FileUploader from "@/components/audio/FileUploader";
import { Tooltip } from "@/components/ui/tooltip";
import { logger, LogCategory } from "@/utils/logging";

interface ChatInputActionsProps {
  isLoading: boolean;
  message: string;
  handleSubmit: () => void;
  onTranscriptionComplete: (text: string) => void;
  handleFileUpload: (file: File) => void;
}

const ChatInputActions = ({
  isLoading,
  message,
  handleSubmit,
  onTranscriptionComplete,
  handleFileUpload
}: ChatInputActionsProps) => {
  const handleSubmitClick = () => {
    logger.debug(LogCategory.USER_ACTION, 'ChatInputActions', 'Submit button clicked', {
      messageLength: message.length,
      isLoading,
      timestamp: new Date().toISOString()
    });
    handleSubmit();
  };

  return (
    <div 
      className="flex items-center justify-between px-4 py-2"
      role="toolbar"
      aria-label="Message actions"
    >
      <div className="flex items-center gap-2">
        <AudioRecorder 
          onTranscriptionComplete={onTranscriptionComplete}
          aria-label="Record audio message"
        />
        <FileUploader 
          onFileSelected={handleFileUpload}
          aria-label="Upload audio file"
        />
      </div>
      <Tooltip content={
        isLoading ? "Sending message..." : 
        !message.trim() ? "Please enter a message" : 
        "Send message"
      }>
        <Button
          onClick={handleSubmitClick}
          disabled={isLoading || !message.trim()}
          className={`transition-all duration-200 ${
            !message.trim() ? 'opacity-50' : ''
          }`}
          size="icon"
          variant="ghost"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

export default ChatInputActions;