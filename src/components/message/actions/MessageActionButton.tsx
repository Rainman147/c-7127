import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageActionButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  activeClassName?: string;
}

const MessageActionButton = ({
  icon: Icon,
  onClick,
  disabled = false,
  active = false,
  className = '',
  activeClassName = ''
}: MessageActionButtonProps) => {
  return (
    <button 
      className={cn(
        'p-1 hover:text-white transition-colors',
        active && activeClassName,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

export default MessageActionButton;