import { FileText, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const SidebarNavigation = () => {
  const location = useLocation();

  return (
    <div className="space-y-4">
      <Link 
        to="/templates"
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[#2F2F2F] cursor-pointer",
          location.pathname === '/templates' && "bg-[#2F2F2F]"
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm">Template Manager</span>
      </Link>

      <Link 
        to="/patients"
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-[#2F2F2F] cursor-pointer",
          location.pathname === '/patients' && "bg-[#2F2F2F]"
        )}
      >
        <Users className="h-4 w-4" />
        <span className="text-sm">Patients Manager</span>
      </Link>
    </div>
  );
};