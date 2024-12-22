import { Button } from "@/components/ui/button";
import { TwoLineMenuIcon } from "@/components/icons/TwoLineMenuIcon";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export const SidebarToggle = () => {
  const { isOpen, open } = useSidebar();

  console.log('[SidebarToggle] Rendering with state:', { isOpen });

  return (
    <Button
      onClick={() => {
        console.log('[SidebarToggle] Toggle clicked, current state:', { isOpen });
        open();
      }}
      variant="ghost"
      size="icon"
      className={cn(
        "fixed top-4 left-4 z-[100]",
        "transition-all duration-300 ease-in-out",
        isOpen ? "opacity-0 pointer-events-none -translate-x-full" : "opacity-100 translate-x-0",
        "text-white/70 hover:text-white"
      )}
    >
      <TwoLineMenuIcon className="h-5 w-5" />
    </Button>
  );
};