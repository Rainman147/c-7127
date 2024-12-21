import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TwoLineMenuIcon } from "@/components/icons/TwoLineMenuIcon";

interface SidebarHeaderProps {
  onNewChat: () => void;
  onClose: () => void;
}

export const SidebarHeader = ({ onNewChat, onClose }: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between h-[60px] px-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white"
        >
          <TwoLineMenuIcon className="h-5 w-5" />
        </Button>
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="text-white/70 hover:text-white flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Chat</span>
        </Button>
      </div>
    </div>
  );
};