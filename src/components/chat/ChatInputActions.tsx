import { useState } from "react";
import { Loader2, ArrowUp, Mic, MicOff } from "lucide-react";
import AudioRecorder from "../AudioRecorder";
import FileUploadModal from "../FileUploadModal";
import { useAudioTranscription } from "@/hooks/useAudioTranscription";

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
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording
  } = useAudioTranscription();

  const handleRecordingClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-2 bg-transparent">
      {/* Left side icons */}
      <div className="flex items-center space-x-2">
        <FileUploadModal 
          onFileSelected={handleFileUpload}
          onTranscriptionComplete={onTranscriptionComplete}
        />
        <button
          onClick={handleRecordingClick}
          disabled={isProcessing}
          className={`p-2 rounded-full transition-colors duration-200 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Right side icons */}
      <div className="flex items-center space-x-2">
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