import { ChevronLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { ChatSessionList } from "./sidebar/ChatSessionList";
import { SidebarFooter } from "./sidebar/SidebarFooter";

/**
 * Sidebar component for chat navigation and session management
 * Handles creating new chats and switching between existing chat sessions
 */
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

  /**
   * Creates a new chat session and sets it as active
   */
  const handleNewChat = async () => {
    console.log('[Sidebar] Creating new chat session');
    const sessionId = await createSession();
    if (sessionId) {
      console.log('[Sidebar] New chat session created:', sessionId);
      setActiveSessionId(sessionId);
      close();
    }
  };

  /**
   * Handles selection of an existing chat session
   * @param sessionId - The ID of the selected session
   */
  const handleSessionClick = async (sessionId: string) => {
    console.log('[Sidebar] Session selected:', sessionId);
    setActiveSessionId(sessionId);
    close();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Sidebar content */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-chatgpt-sidebar",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[60px] px-4">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Chat</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={close}
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={close}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-hidden">
          <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto sidebar-scrollbar">
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
      </div>
    </>
  );
};

export default Sidebar;