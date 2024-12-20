import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";

export const SidebarHeader = () => {
  const { close } = useSidebar();

  const handleToggle = () => {
    console.log('[SidebarHeader] Toggle button clicked');
    close();
  };

  return (
    <div className="flex items-center justify-between h-[60px] px-4">
      <span className="text-white/90 font-medium">Chat History</span>
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="icon"
        className="text-white/70 hover:text-white md:hidden"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};