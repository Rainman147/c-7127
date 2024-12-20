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
    console.log('[AppHeader] Mounted with variant:', variant);
    console.log('[AppHeader] Current route:', location.pathname);
    setMounted(true);
  }, [variant, location.pathname]);

  useEffect(() => {
    console.log('[AppHeader] Sidebar state changed:', { isOpen });
  }, [isOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-chatgpt-main/95 backdrop-blur z-50 border-b border-white/20">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={open}
            variant="ghost"
            className={cn(
              "transition-opacity duration-300 ease-in-out",
              isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
              mounted ? "visible" : "invisible" // Prevent flash on mount
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