import { useChatSessions } from "@/hooks/useChatSessions";
import { useSidebar } from "@/contexts/SidebarContext";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { ChatSessionList } from "./sidebar/ChatSessionList";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Sidebar = () => {
  const { isOpen, close } = useSidebar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    isLoading
  } = useChatSessions();

  const handleNewChat = async () => {
    console.log('[Sidebar] Initiating new chat');
    try {
      // Clear active session before creating new one
      setActiveSessionId(null);
      
      // Get current template if exists
      const templateId = searchParams.get('template');
      
      // Navigate to root with template param if exists
      const queryParams = new URLSearchParams();
      if (templateId) {
        queryParams.set('template', templateId);
      }
      const queryString = queryParams.toString();
      navigate(`/${queryString ? `?${queryString}` : ''}`);
      
      console.log('[Sidebar] Navigated to new chat with params:', queryString);
      close();
    } catch (error) {
      console.error('[Sidebar] Error creating new chat:', error);
      toast({
        title: "Error",
        description: "Failed to start new chat",
        variant: "destructive"
      });
    }
  };

  const handleSessionClick = async (sessionId: string) => {
    console.log('[Sidebar] Switching to session:', sessionId);
    try {
      setActiveSessionId(sessionId);
      
      // Preserve template parameter when switching sessions
      const templateId = searchParams.get('template');
      const queryParams = new URLSearchParams();
      if (templateId) {
        queryParams.set('template', templateId);
      }
      const queryString = queryParams.toString();
      
      navigate(`/c/${sessionId}${queryString ? `?${queryString}` : ''}`);
      console.log('[Sidebar] Successfully switched to session:', sessionId);
      close();
    } catch (error) {
      console.error('[Sidebar] Error switching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to switch chat sessions",
        variant: "destructive"
      });
    }
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
        <SidebarHeader onNewChat={handleNewChat} onClose={close} />

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-hidden">
          <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto sidebar-scrollbar">
            <SidebarNavigation />
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/70" />
              </div>
            ) : (
              <ChatSessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSessionSelect={handleSessionClick}
                onSessionDelete={deleteSession}
                onSessionRename={renameSession}
              />
            )}
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