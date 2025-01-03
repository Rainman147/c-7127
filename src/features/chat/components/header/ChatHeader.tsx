import { memo } from "react";
import { TemplateSelector } from "@/components/TemplateSelector";
import { PatientSelector } from "@/components/patients/PatientSelector";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUI } from "@/contexts/UIContext";
import type { Template } from "@/types";

interface ChatHeaderProps {
  currentChatId: string | null;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
}

const ChatHeaderComponent = ({ 
  currentChatId,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId
}: ChatHeaderProps) => {
  const { toast } = useToast();
  const { isSidebarOpen } = useUI();
  
  console.log('[ChatHeader] Rendering with:', { 
    isSidebarOpen, 
    currentChatId,
    selectedPatientId,
    hasTemplateChangeHandler: !!onTemplateChange,
    hasPatientSelectHandler: !!onPatientSelect
  });
  
  const handleTemplateChange = (template: Template) => {
    console.log('[ChatHeader] Template change requested:', template);
    onTemplateChange(template);
  };

  const handlePatientSelect = async (patientId: string | null) => {
    console.log('[ChatHeader] Patient selection changed:', patientId);
    await onPatientSelect(patientId);
  };

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
    <div className="fixed top-0 z-30 w-full border-b border-white/20 bg-chatgpt-main/95 backdrop-blur">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <span className={`${!isSidebarOpen ? 'ml-24' : ''}`}>
            <TemplateSelector 
              key={currentChatId || 'default'}
              currentChatId={currentChatId}
              onTemplateChange={handleTemplateChange}
            />
          </span>
          <PatientSelector onPatientSelect={handlePatientSelect} />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=default" />
                <AvatarFallback>
                  <User2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
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
    </div>
  );
};

export const ChatHeader = memo(ChatHeaderComponent);

ChatHeader.displayName = 'ChatHeader';