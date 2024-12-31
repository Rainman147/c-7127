import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarHeaderProps {
  onToggle: () => void;
}

const SidebarHeader = ({ onToggle }: SidebarHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      <h2 className="text-xl font-bold text-white">Menu</h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="text-white hover:bg-gray-700"
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default SidebarHeader;