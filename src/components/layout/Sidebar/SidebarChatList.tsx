import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useChatSessions } from '@/hooks/useChatSessions';
import { cn } from '@/lib/utils';

interface SidebarChatListProps {
  onSessionSelect: (sessionId: string) => void;
}

const SidebarChatList = ({ onSessionSelect }: SidebarChatListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    deleteSession,
    renameSession,
  } = useChatSessions();

  const handleEditStart = (session: { id: string; title: string }) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = async (id: string) => {
    await renameSession(id, editTitle);
    setEditingId(null);
    setEditTitle("");
  };

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    onSessionSelect(sessionId);
  };

  return (
    <div className="space-y-2 flex-1 overflow-y-auto">
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
  );
};

export default SidebarChatList;