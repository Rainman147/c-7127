import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { extractParameters } from "@/utils/functionMapping/parameterExtractor";
import { useFunctionCalling } from "@/hooks/useFunctionCalling";

interface UseMessageSubmissionProps {
  onSend: (message: string, type?: 'text' | 'audio') => void;
}

export const useMessageSubmission = ({ onSend }: UseMessageSubmissionProps) => {
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const { handleFunctionCall, isProcessing } = useFunctionCalling();

  const handleSubmit = async () => {
    if (message.trim() && !isProcessing) {
      console.log('[useMessageSubmission] Submitting message:', message);
      
      // Check if the message starts with a command prefix (e.g., "/")
      const isCommand = message.trim().startsWith('/');
      
      // Send regular messages directly without function extraction
      if (!isCommand) {
        console.log('[useMessageSubmission] Sending regular chat message');
        onSend(message, 'text');
        setMessage("");
        return;
      }

      // Only try to extract parameters for command messages
      console.log('[useMessageSubmission] Processing command message');
      const extracted = extractParameters(message);
      
      if (extracted.function && !extracted.clarificationNeeded) {
        try {
          onSend(message, 'text');
          setMessage("");
          
          handleFunctionCall(extracted.function, extracted.parameters)
            .then(result => {
              console.log('[useMessageSubmission] Function call result:', result);
              if (result) {
                onSend(JSON.stringify(result, null, 2), 'text');
              }
            })
            .catch(error => {
              console.error('[useMessageSubmission] Function call error:', error);
              toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
              });
            });
        } catch (error: any) {
          console.error('[useMessageSubmission] Function call setup error:', error);
        }
      } else if (extracted.clarificationNeeded && extracted.missingRequired) {
        const missingParams = extracted.missingRequired.join(', ');
        toast({
          title: "Missing Information",
          description: `Please provide: ${missingParams}`,
          duration: 5000,
        });
      }
    }
  };

  return {
    message,
    setMessage,
    handleSubmit,
    isProcessing
  };
};