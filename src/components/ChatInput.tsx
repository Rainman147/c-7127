import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import FileUploadModal from "./FileUploadModal";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
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
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTranscriptionComplete = (transcription: string) => {
    console.log('Transcription complete in ChatInput:', transcription);
    setMessage(transcription);
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file);
    // The FileUploadModal component will handle the actual file processing
    // and call onTranscriptionComplete when done
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full max-w-4xl bg-[#2F2F2F] rounded-xl">
        {/* Input field */}
        <div className="w-full">
          <textarea
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Claude"
            className="w-full resize-none bg-transparent px-4 py-4 focus:outline-none"
            style={{ maxHeight: "200px" }}
            disabled={isLoading}
          />
        </div>
        
        {/* Icon row */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700">
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
              onTranscriptionComplete={handleTranscriptionComplete}
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
      </div>
    </div>
  );
};

export default ChatInput;