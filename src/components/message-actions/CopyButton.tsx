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
    const success = await copyToClipboard(content);
    if (success) {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Show toast near the button
      toast({
        description: "Copied to clipboard!",
        duration: 2000,
        className: "absolute bottom-8 left-1/2 -translate-x-1/2 w-auto min-w-0",
      });
    } else {
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