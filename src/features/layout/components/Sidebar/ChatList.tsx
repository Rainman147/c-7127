import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatListProps {
  sessions: any[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionEdit: (session: { id: string; title: string }) => void;
  onSessionDelete: (sessionId: string) => void;
}

const ChatList = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionEdit,
  onSessionDelete
}: ChatListProps) => {
  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={cn(
            "group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-chatgpt-hover/45 cursor-pointer transition-all duration-200",
            activeSessionId === session.id && "bg-chatgpt-hover/45"
          )}
        >
          <div
            className="flex-1 truncate text-sm"
            onClick={() => onSessionSelect(session.id)}
          >
            {session.title}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onSessionEdit(session)}
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
                    onClick={() => onSessionDelete(session.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;