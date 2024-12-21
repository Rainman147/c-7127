import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";
import { extractParameters } from "@/utils/functionMapping/parameterExtractor";
import ChatInputField from "./chat/ChatInputField";
import ChatInputActions from "./chat/ChatInputActions";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInputComponent = ({ 
  onSend, 
  onTranscriptionComplete,
  onTranscriptionUpdate,
  isLoading = false 
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();

  const handleSubmit = async () => {
    if (message.trim() && !isLoading && !isProcessing) {
      console.log('[ChatInput] Submitting message:', message);
      
      // Send the message immediately to improve responsiveness
      onSend(message, 'text');
      setMessage("");
      
      // Try to extract function call parameters
      const extracted = extractParameters(message);
      console.log('[ChatInput] Extracted parameters:', extracted);

      if (extracted.function && !extracted.clarificationNeeded) {
        try {
          // Handle function call asynchronously without blocking
          handleFunctionCall(extracted.function, extracted.parameters)
            .then(result => {
              console.log('[ChatInput] Function call result:', result);
              if (result) {
                // Send function result as a separate message
                onSend(JSON.stringify(result, null, 2), 'text');
              }
            })
            .catch(error => {
              console.error('[ChatInput] Function call error:', error);
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
              });
            });
        } catch (error: any) {
          console.error('[ChatInput] Function call setup error:', error);
        }
      } else if (extracted.clarificationNeeded) {
        // Handle missing parameters with a toast notification
        const missingParams = extracted.missingRequired.join(', ');
        toast({
          title: "Missing Information",
          description: `Please provide: ${missingParams}`,
          duration: 5000,
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isProcessing) {
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
  };

  return (
    <div className="relative flex w-full flex-col items-center">
      <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
        <ChatInputField
          message={message}
          setMessage={setMessage}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading || isProcessing}
        />
        <ChatInputActions
          isLoading={isLoading || isProcessing}
          message={message}
          handleSubmit={handleSubmit}
          onTranscriptionComplete={handleTranscriptionComplete}
          handleFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

const ChatInput = ChatInputComponent;
export default ChatInput;