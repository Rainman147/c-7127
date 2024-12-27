import React from "react";
import { Button } from "../ui/button";
import { Send } from "lucide-react";
import { AudioRecorder } from "../AudioRecorder";
import { FileUploader } from "../audio/FileUploader";

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
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <AudioRecorder onTranscriptionComplete={onTranscriptionComplete} />
        <FileUploader onFileSelect={handleFileUpload} />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !message.trim()}
        className={`transition-opacity duration-200 ${
          !message.trim() ? 'opacity-50' : ''
        }`}
        size="icon"
        variant="ghost"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ChatInputActions;