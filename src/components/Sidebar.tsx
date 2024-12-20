import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { ChatSessionList } from "./sidebar/ChatSessionList";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { useEffect } from "react";

const Sidebar = () => {
  const { isOpen, close } = useSidebar();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  // Log mobile interactions
  useEffect(() => {
    console.log('[Sidebar] Mobile state:', {
      isOpen,
      isMobile: window.innerWidth < 768,
      viewportWidth: window.innerWidth
    });
  }, [isOpen]);

  const handleNewChat = async () => {
    console.log('[Sidebar] Creating new chat session');
    const sessionId = await createSession();
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('[Sidebar] Session selected:', sessionId);
    setActiveSessionId(sessionId);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      close();
    }
  };

  return (
    <>
      {/* Enhanced Mobile backdrop with blur */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Sidebar with improved mobile transitions */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-chatgpt-sidebar",
          "transform transition-transform duration-300 ease-in-out layout-transition",
          "flex flex-col",
          "touch-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader />

        <nav className="flex-1 px-3 overflow-hidden">
          <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto sidebar-scrollbar">
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
          </div>
        </nav>

        <SidebarFooter 
          apiKey=""
          onApiKeyChange={() => {}}
        />
      </aside>
    </>
  );
};

export default Sidebar;