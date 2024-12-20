import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useChatSessions } from "@/hooks/useChatSessions";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { ChatSessionList } from "./sidebar/ChatSessionList";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar = ({ isOpen, onToggle, onApiKeyChange, onSessionSelect }: SidebarProps) => {
  const [apiKey, setApiKey] = useState("");
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    onApiKeyChange(newApiKey);
  };

  const handleNewChat = async () => {
    const sessionId = await createSession();
    if (sessionId) {
      setActiveSessionId(sessionId);
      onSessionSelect(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    onSessionSelect(sessionId);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-chatgpt-sidebar transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
          <SidebarHeader onToggle={onToggle} />

          <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto sidebar-scrollbar">
            {isOpen && (
              <>
                <div className="mb-4">
                  <Button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 bg-[#2F2F2F] hover:bg-[#404040] rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>

                <SidebarNavigation />

                <ChatSessionList
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSessionSelect={handleSessionClick}
                  onSessionDelete={deleteSession}
                  onSessionRename={renameSession}
                />
              </>
            )}
          </div>

          {isOpen && (
            <SidebarFooter 
              apiKey={apiKey}
              onApiKeyChange={handleApiKeyChange}
            />
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;