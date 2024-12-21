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
        "transition-all duration-300 ease-in-out text-white/70 hover:text-white fixed",
        isOpen ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100",
        "z-50 left-4 top-4"
      )}
    >
      <TwoLineMenuIcon className="h-5 w-5" />
    </Button>
  );
};