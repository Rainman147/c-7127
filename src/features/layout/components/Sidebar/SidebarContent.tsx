import { Link, useLocation } from 'react-router-dom';
import { Users, FileText } from 'lucide-react';

const SidebarContent = () => {
  const location = useLocation();
  console.log('[SidebarContent] Current location:', location.pathname);

  return (
    <div className="flex-1 overflow-y-auto">
      <nav className="flex flex-col gap-1 px-2 py-2">
        <Link
          to="/patients"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <Users className="h-4 w-4" />
          Patients
        </Link>
        
        <Link
          to="/templates"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <FileText className="h-4 w-4" />
          Templates
        </Link>
      </nav>
    </div>
  );
};

export default SidebarContent;