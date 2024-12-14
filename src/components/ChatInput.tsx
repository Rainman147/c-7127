import { useState } from "react";
import { ArrowUp, Loader2, X } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
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
    // Always set the transcription in the input field first
    setMessage(transcription);
    
    // Notify parent component but don't directly send the message
    onTranscriptionComplete(transcription);
    
    toast({
      title: "Transcription complete",
      description: "Your audio has been transcribed. Review and edit before sending.",
      duration: 3000,
    });
  };

  const handleClearInput = () => {
    setMessage("");
    toast({
      title: "Input cleared",
      description: "The message input has been cleared.",
    });
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="relative w-full">
        <textarea
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude"
          className="w-full resize-none rounded-full bg-[#2F2F2F] px-4 py-4 pr-24 focus:outline-none"
          style={{ maxHeight: "200px" }}
          disabled={isLoading}
        />
        <div className="absolute right-3 top-[50%] -translate-y-[50%] flex items-center gap-2">
          {message && (
            <button
              onClick={handleClearInput}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
              title="Clear input"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <AudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
          />
          <button 
            onClick={handleSubmit}
            disabled={isLoading || !message.trim()}
            className="p-1.5 bg-white rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-black animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4 text-black" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;