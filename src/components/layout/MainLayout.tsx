import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={cn(
        "flex-1 relative transition-all duration-300 ease-in-out",
        "z-0"
      )}>
        <main className="max-w-[1200px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;