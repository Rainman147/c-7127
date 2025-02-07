
import { Key, Settings, LogOut, User2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

interface SidebarFooterProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

const SidebarFooter = ({ apiKey, onApiKeyChange }: SidebarFooterProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Even if we get a session_not_found error, continue with logout flow
      if (error && error.message !== 'Session not found') {
        console.error('[SidebarFooter] Error logging out:', error);
        toast({
          title: "Error logging out",
          description: "There was a problem logging out. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Always clear local state and redirect regardless of error
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('[SidebarFooter] Unexpected error during logout:', error);
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAccountSettings = () => {
    console.log('Navigate to account settings');
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('No user email found');
      }

      // Delete all related data in the correct order
      const { error: deleteError } = await supabase.rpc('delete_user_data', {
        user_email: user.email
      });

      if (deleteError) throw deleteError;

      // Sign out after successful deletion
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted successfully",
        description: "Your account and all associated data have been removed",
      });
      
      navigate('/auth');
    } catch (error) {
      console.error('[SidebarFooter] Error deleting account:', error);
      toast({
        title: "Error deleting account",
        description: "There was a problem deleting your account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-auto border-t border-chatgpt-border pt-4 pb-4">
      <div className="px-3 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-chatgpt-hover transition-colors focus:outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" />
                <AvatarFallback>
                  <User2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left text-sm">Account</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleAccountSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-500 focus:text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all of your data including chats, patients, and templates.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2 px-3">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4" />
          <span className="text-sm">API Key</span>
        </div>
        <Input
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="bg-[#2F2F2F] border-none rounded-xl"
        />
      </div>
    </div>
  );
};

export default SidebarFooter;
