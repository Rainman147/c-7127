import { useState, useCallback } from "react";
import { LogOut, Settings, User2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { DoctorProfileDialog } from "../DoctorProfileDialog";
import { useToast } from "@/hooks/use-toast";

interface ProfileMenuProps {
  profilePhotoUrl: string | null;
}

export const ProfileMenu = ({ profilePhotoUrl }: ProfileMenuProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { toast } = useToast();

  console.log('[ProfileMenu] Rendering with profilePhotoUrl:', profilePhotoUrl);

  const handleLogout = useCallback(async () => {
    console.log('[ProfileMenu] Initiating logout process');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[ProfileMenu] Logout error:', error.message);
        // Check if it's a session not found error
        if (error.message.includes('session_not_found') || error.status === 403) {
          console.log('[ProfileMenu] Session already expired, cleaning up local state');
          // Session already expired, we can ignore this error
          return;
        }
        toast({
          title: "Logout Error",
          description: error.message,
          variant: "destructive",
        });
      }
      console.log('[ProfileMenu] Logout successful');
    } catch (error) {
      console.error('[ProfileMenu] Critical logout error:', error);
    }
  }, [toast]);

  const handleProfileClick = useCallback(() => {
    console.log('[ProfileMenu] Opening profile dialog');
    setIsProfileOpen(true);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage 
                src={profilePhotoUrl || ""} 
                alt="Profile" 
              />
              <AvatarFallback>
                <User2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="menu-box w-56"
        >
          <div className="menu-dialog-header">
            <span className="menu-dialog-title">Account</span>
          </div>
          <div className="p-1">
            <DropdownMenuItem onClick={handleProfileClick} className="menu-item">
              <User2 className="h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="menu-item">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-white/[0.05]" />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="menu-item text-red-500 focus:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DoctorProfileDialog 
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  );
};