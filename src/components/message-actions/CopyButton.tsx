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
      toast({
        description: "Response copied to clipboard!",
        duration: 2000,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to copy response",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>
          <button
            className="p-1 hover:text-white transition-colors"
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