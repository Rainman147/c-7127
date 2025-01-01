import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import ChatInputActions from "./ChatInputActions";
import ChatInputField from "./ChatInputField";

interface ChatInputProps {
  onMessageSubmit: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput = ({ onMessageSubmit, isLoading = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = useCallback(() => {
    console.log('[ChatInput] Submitting message:', message);
    if (!message.trim()) return;
    
    onMessageSubmit(message);
    setMessage("");
  }, [message, onMessageSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleTranscriptionComplete = useCallback((text: string) => {
    console.log('[ChatInput] Transcription completed:', text);
    setMessage((prev) => prev + (prev ? "\n" : "") + text);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    console.log('[ChatInput] File uploaded:', file.name);
    toast({
      title: "Processing file",
      description: "Your file is being processed...",
    });
  }, [toast]);

  return (
    <div className="border-t border-gray-300 bg-white">
      <div className="max-w-3xl mx-auto">
        <ChatInputField
          message={message}
          setMessage={setMessage}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading}
        />
        <ChatInputActions
          isLoading={isLoading}
          message={message}
          handleSubmit={handleSubmit}
          onTranscriptionComplete={handleTranscriptionComplete}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default ChatInput;