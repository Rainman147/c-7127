import { Plus, X } from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
    if (isMobile) {
      onToggle();
    }
  };

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isMobile ? "w-full md:w-64" : "w-64"
      )}
    >
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <div className="flex items-center justify-between h-[60px]">
          <SidebarHeader onToggle={onToggle} />
          {isMobile && (
            <Button
              onClick={onToggle}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

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
  );
};

export default Sidebar;