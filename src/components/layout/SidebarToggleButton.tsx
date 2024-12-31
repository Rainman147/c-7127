import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarToggleButtonProps {
  onClick: () => void;
  className?: string;
}

const SidebarToggleButton = ({ onClick, className }: SidebarToggleButtonProps) => {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "h-10 rounded-lg px-2 text-gray-400 hover:text-gray-200 transition-colors",
        className
      )}
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};

export default SidebarToggleButton;