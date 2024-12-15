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
    setMessage(transcription);
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
    <div className="relative flex w-full flex-col items-center space-y-2">
      <div className="relative w-full">
        <textarea
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude"
          className="w-full resize-none rounded-lg bg-[#2F2F2F] px-4 py-3 focus:outline-none"
          style={{ maxHeight: "200px" }}
          disabled={isLoading}
        />
        {message && (
          <button
            onClick={handleClearInput}
            className="absolute right-3 top-[50%] -translate-y-[50%] p-1.5 hover:bg-gray-700 rounded-full transition-colors"
            title="Clear input"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>
      
      <div className="flex justify-end items-center gap-2 w-full px-2">
        <AudioRecorder 
          onTranscriptionComplete={handleTranscriptionComplete}
          className="opacity-70 hover:opacity-100 transition-opacity"
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="p-2 rounded-lg hover:bg-[#2F2F2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;