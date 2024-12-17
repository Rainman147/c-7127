import { useState } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/utils/clipboard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CopyButtonProps = {
  content: string;
};

export const CopyButton = ({ content }: CopyButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    console.log('[CopyButton] Attempting to copy content');
    const success = await copyToClipboard(content);
    
    if (success) {
      console.log('[CopyButton] Copy successful, attempting haptic feedback');
      
      try {
        // Try to trigger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
          console.log('[CopyButton] Haptic feedback triggered');
        } else {
          console.log('[CopyButton] Haptic feedback not available');
        }
      } catch (error) {
        console.log('[CopyButton] Error triggering haptic feedback:', error);
      }
      
      // Show toast near the button with updated positioning and styling
      toast({
        description: "Copied!",
        duration: 2000,
        className: "fixed bottom-0 left-1/2 -translate-x-1/2 mb-20 w-auto min-w-0 z-[9999] bg-black/80 text-white px-3 py-2 rounded-md text-sm",
      });
      console.log('[CopyButton] Toast notification triggered');
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
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <button
            className="p-1 hover:text-white transition-colors relative"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy response</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};