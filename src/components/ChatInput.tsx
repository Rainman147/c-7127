import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import AudioRecorder from "./AudioRecorder";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
  onTranscriptionUpdate?: (text: string) => void;
  onTranscriptionComplete: (text: string) => void;  // Changed from optional to required
  isLoading?: boolean;
}

const ChatInput = ({ 
  onSend, 
  onTranscriptionUpdate, 
  onTranscriptionComplete,
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
    setMessage(prev => prev + (prev ? ' ' : '') + transcription);
    onTranscriptionComplete(transcription);
    toast({
      title: "Transcription complete",
      description: "Your audio has been successfully transcribed.",
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
          <AudioRecorder 
            onTranscriptionComplete={handleTranscriptionComplete}
            onTranscriptionUpdate={onTranscriptionUpdate}
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