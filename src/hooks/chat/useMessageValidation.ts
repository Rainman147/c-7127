import { logger, LogCategory } from "@/utils/logging";
import { useToast } from "@/hooks/use-toast";

const MAX_MESSAGE_LENGTH = 4000;

export const useMessageValidation = () => {
  const { toast } = useToast();

  const validateMessage = (message: string): boolean => {
    if (!message.trim()) {
      logger.warn(LogCategory.VALIDATION, 'MessageValidation', 'Empty message rejected');
      return false;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      logger.warn(LogCategory.VALIDATION, 'MessageValidation', 'Message exceeds length limit:', {
        length: message.length,
        limit: MAX_MESSAGE_LENGTH
      });
      
      toast({
        title: "Message too long",
        description: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    validateMessage,
    MAX_MESSAGE_LENGTH
  };
};