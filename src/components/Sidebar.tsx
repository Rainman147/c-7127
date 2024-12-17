import { Menu, Plus, Pencil, Trash2, ChevronDown, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/useChatSessions";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

const Sidebar = ({ isOpen, onToggle, onApiKeyChange, onSessionSelect, onNewChat }: SidebarProps) => {
  const [apiKey, setApiKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    isLoading,
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
        <div className="flex justify-between items-center h-[60px]">
          <button onClick={onToggle} className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-sidebar-surface-secondary">
            <Menu className="h-5 w-5" />
          </button>
          <Button
            onClick={onNewChat}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-col flex-1 transition-opacity duration-500 relative -mr-2 pr-2 overflow-y-auto">
          {isOpen && (
            <>
              <div className="p-2 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4" />
                  <span className="text-sm">API Key</span>
                </div>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="bg-[#2F2F2F] border-none"
                />
              </div>

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
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;