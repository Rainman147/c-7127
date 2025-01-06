import { Key, Settings, LogOut, User2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SidebarFooterProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

const SidebarFooter = ({ apiKey, onApiKeyChange }: SidebarFooterProps) => {
  const { toast } = useToast();

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

  const handleAccountSettings = () => {
    console.log('Navigate to account settings');
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
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
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