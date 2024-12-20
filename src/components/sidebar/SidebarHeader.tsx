import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  onToggle: () => void;
}

export const SidebarHeader = ({ onToggle }: SidebarHeaderProps) => {
  const handleToggle = () => {
    console.log('[SidebarHeader] Toggle button clicked');
    onToggle();
  };

  return (
    <div className="flex justify-between flex h-[60px] items-center">
      <Button 
        onClick={handleToggle} 
        className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-sidebar-surface-secondary"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
};