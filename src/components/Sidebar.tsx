import { Menu, Plus, Pencil, Trash2, ChevronDown, Key, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/useChatSessions";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onSessionSelect: (sessionId: string) => void;
}

const Sidebar = ({ isOpen, onToggle, onApiKeyChange, onSessionSelect }: SidebarProps) => {
  const [apiKey, setApiKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
    createSession,
    deleteSession,
    renameSession,
  } = useChatSessions();

  // Check if device is mobile
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

  const handleEditStart = (session: { id: string; title: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = async (id: string) => {
    await renameSession(id, editTitle);
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 z-40 h-screen bg-chatgpt-sidebar transition-all duration-300",
      isOpen ? "w-64" : "w-0"
    )}>
      <nav className="flex h-full w-full flex-col px-3" aria-label="Chat history">
        <div className="flex justify-between flex h-[60px] items-center">
          <button onClick={onToggle} className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-sidebar-surface-secondary">
            <Menu className="h-5 w-5" />
          </button>
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

              <div className="space-y-4">
                {/* Template Manager Link */}
                <Link 
                  to="/templates"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[#2F2F2F] cursor-pointer",
                    location.pathname === '/templates' && "bg-[#2F2F2F]"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Template Manager</span>
                </Link>

                {/* Chat Sessions */}
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-[#2F2F2F] cursor-pointer",
                        activeSessionId === session.id && "bg-[#2F2F2F]"
                      )}
                    >
                      {editingId === session.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleEditSave(session.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(session.id);
                            }
                          }}
                          className="flex-1 bg-[#404040] border-none"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div
                            className="flex-1 truncate text-sm"
                            onClick={() => handleSessionClick(session.id)}
                          >
                            {session.title}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditStart(session)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this chat? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteSession(session.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer section with API Key input */}
        {isOpen && (
          <div className="mt-auto border-t border-chatgpt-border pt-4 pb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4" />
                <span className="text-sm">API Key</span>
              </div>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={handleApiKeyChange}
                className="bg-[#2F2F2F] border-none rounded-xl"
              />
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;