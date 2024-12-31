import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SessionHeader = ({ isCollapsed, onToggle }: SessionHeaderProps) => {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-400 hover:text-gray-300"
    >
      <span>Session History</span>
      <ChevronDown 
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          !isCollapsed && "transform rotate-180"
        )} 
      />
    </button>
  );
};

export default SessionHeader;