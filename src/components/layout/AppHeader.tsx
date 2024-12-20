import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  variant?: 'default' | 'chat';
}

const AppHeader = ({ 
  leftContent, 
  centerContent, 
  rightContent,
  variant = 'default' 
}: AppHeaderProps) => {
  const { isOpen, open } = useSidebar();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('[AppHeader] Viewport state:', {
      width: window.innerWidth,
      isMobile: window.innerWidth < 768,
      variant,
      path: location.pathname
    });
    setMounted(true);
  }, [variant, location.pathname]);

  useEffect(() => {
    console.log('[AppHeader] Sidebar state changed:', { 
      isOpen,
      isMobile: window.innerWidth < 768
    });
  }, [isOpen]);

  return (
    <header className={cn(
      "h-[60px] bg-chatgpt-main/95 backdrop-blur border-b border-white/20",
      "sticky top-0 z-10 transition-all duration-300",
      // Enhanced mobile padding
      "px-2 md:px-4"
    )}>
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            onClick={open}
            variant="ghost"
            size="icon"
            className={cn(
              "transition-opacity duration-300 ease-in-out",
              isOpen ? "opacity-0 pointer-events-none md:hidden" : "opacity-100",
              mounted ? "visible" : "invisible"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {leftContent}
        </div>
        
        {centerContent && (
          <div className="flex-1 flex justify-center">
            {centerContent}
          </div>
        )}
        
        {rightContent && (
          <div className="flex items-center">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;