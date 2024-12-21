import { Button } from "@/components/ui/button";
import { TwoLineMenuIcon } from "@/components/icons/TwoLineMenuIcon";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";

export const SidebarToggle = () => {
  const { isOpen, open } = useSidebar();

  return (
    <Button
      onClick={open}
      variant="ghost"
      size="icon"
      className={cn(
        "fixed top-4 left-4 z-50",
        "transition-opacity duration-300 ease-in-out",
        isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        "text-white/70 hover:text-white"
      )}
    >
      <TwoLineMenuIcon className="h-5 w-5" />
    </Button>
  );
};