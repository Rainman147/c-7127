import { useState } from "react";
import { Loader2, ArrowUp } from "lucide-react";
import AudioRecorder from "@/features/chat/components/input/audio/AudioRecorder";
import FileUploadModal from "@/features/chat/components/upload/FileUploadModal";

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
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordingStateChange = (recording: boolean) => {
    console.log('[ChatInputActions] Recording state changed:', recording);
    setIsRecording(recording);
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-2 bg-[#2F2F2F]">
      {/* Left side icons */}
      <div className="flex items-center space-x-2">
        <FileUploadModal 
          onFileSelected={handleFileUpload}
          onTranscriptionComplete={onTranscriptionComplete}
        />
      </div>
      
      {/* Right side icons */}
      <div className="flex items-center space-x-2">
        <AudioRecorder 
          onTranscriptionComplete={onTranscriptionComplete}
          onRecordingStateChange={handleRecordingStateChange}
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="p-2 bg-white rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-black animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5 text-black" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInputActions;