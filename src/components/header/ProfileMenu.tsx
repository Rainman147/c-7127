import { useState } from "react";
import { LogOut, Settings, User2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DoctorProfileDialog } from "../DoctorProfileDialog";

interface ProfileMenuProps {
  profilePhotoUrl: string | null;
}

export const ProfileMenu = ({ profilePhotoUrl }: ProfileMenuProps) => {
  const { toast } = useToast();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  console.log('[ProfileMenu] Rendering with profilePhotoUrl:', profilePhotoUrl);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage 
                src={profilePhotoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"} 
                alt="Profile" 
              />
              <AvatarFallback>
                <User2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
            <User2 className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DoctorProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  );
};