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
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  profilePhotoUrl: string | null;
}

export const ProfileMenu = ({ profilePhotoUrl }: ProfileMenuProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  console.log('[ProfileMenu] Rendering with profilePhotoUrl:', profilePhotoUrl);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    setIsLoggingOut(true);
    console.log('[ProfileMenu] Initiating logout process');

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[ProfileMenu] Logout error:', error);
        throw error;
      }

      console.log('[ProfileMenu] Logout successful');
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });

      // Navigate to auth page after successful logout
      navigate('/auth');
    } catch (error: any) {
      console.error('[ProfileMenu] Error during logout:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Check if it's a network error
      if (error.message === 'Failed to fetch') {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error logging out",
          description: "There was a problem logging out. Please try again.",
          variant: "destructive",
        });
      }

      // Force client-side session cleanup if server logout fails
      try {
        await supabase.auth.clearSession();
        console.log('[ProfileMenu] Cleared local session after server logout failure');
        navigate('/auth');
      } catch (clearError) {
        console.error('[ProfileMenu] Failed to clear local session:', clearError);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    setIsProfileOpen(true);
  };

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
              {isLoggingOut ? "Logging out..." : "Log Out"}
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