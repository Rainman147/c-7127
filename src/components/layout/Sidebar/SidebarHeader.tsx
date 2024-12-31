import { useUI } from '@/contexts/UIContext';
import SidebarToggleButton from '../SidebarToggleButton';

const SidebarHeader = () => {
  const { toggleSidebar } = useUI();

  return (
    <div className="flex justify-between h-[60px] items-center px-2">
      <SidebarToggleButton onClick={toggleSidebar} />
    </div>
  );
};

export default SidebarHeader;