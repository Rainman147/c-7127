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
import { clearSession } from "@/utils/auth/sessionManager";

interface ProfileMenuProps {
  profilePhotoUrl: string | null;
}

export const ProfileMenu = ({ profilePhotoUrl }: ProfileMenuProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  console.log('[ProfileMenu] Rendering with profilePhotoUrl:', profilePhotoUrl);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      console.log('[ProfileMenu] Logout already in progress, skipping');
      return;
    }

    setIsLoggingOut(true);
    console.log('[ProfileMenu] Initiating logout process');

    try {
      // First clear local storage and attempt server-side cleanup
      await clearSession();
      
      console.log('[ProfileMenu] Logout successful');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('[ProfileMenu] Critical logout error:', error);
      
      // Show error toast but ensure user knows they're logged out
      toast({
        title: "Partial Logout",
        description: "You have been logged out, but there was an issue with the server. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [toast, isLoggingOut]);

  const handleProfileClick = useCallback(() => {
    console.log('[ProfileMenu] Opening profile dialog');
    setIsProfileOpen(true);
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none" disabled={isLoggingOut}>
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
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
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