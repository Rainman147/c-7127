import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  onToggle: () => void;
}

export const SidebarHeader = ({ onToggle }: SidebarHeaderProps) => {
  return (
    <div className="flex justify-between flex h-[60px] items-center">
      <Button 
        onClick={onToggle} 
        className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-sidebar-surface-secondary"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
};