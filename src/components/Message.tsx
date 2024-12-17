import { cn } from "@/lib/utils";
import MessageActions from "./MessageActions";
import MessageAvatar from "./MessageAvatar";

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
};

const Message = ({ role, content, id }: MessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn(
      "py-8 -mx-4 px-4",
      !isUser && "bg-secondary/20"
    )}>
      <div className="flex gap-4 max-w-3xl mx-auto">
        <MessageAvatar role={role} />
        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
          {!isUser && id && (
            <MessageActions content={content} messageId={id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;