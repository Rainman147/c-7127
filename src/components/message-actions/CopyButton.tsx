import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/utils/clipboard";

type CopyButtonProps = {
  content: string;
};

export const CopyButton = ({ content }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    console.log('[CopyButton] Attempting to copy content');
    const success = await copyToClipboard(content);
    
    if (success) {
      console.log('[CopyButton] Copy successful, showing checkmark');
      setIsCopied(true);
      
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
          console.log('[CopyButton] Haptic feedback triggered');
        }
      } catch (error) {
        console.log('[CopyButton] Error triggering haptic feedback:', error);
      }
      
      toast({
        description: "Copied!",
        duration: 2000,
        className: "fixed bottom-0 left-1/2 -translate-x-1/2 mb-20 w-auto min-w-0 z-[9999] bg-black/80 text-white px-3 py-2 rounded-md text-sm",
      });

      setTimeout(() => {
        setIsCopied(false);
        console.log('[CopyButton] Reset copy icon');
      }, 1000);
    } else {
      console.log('[CopyButton] Copy failed');
      toast({
        title: "Error",
        description: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      className="p-1 hover:text-white transition-colors"
      onClick={handleCopy}
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
};