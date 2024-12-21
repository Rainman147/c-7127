import { useEffect, useRef } from "react";
import Message from "./Message";
import type { Message as MessageType } from "@/types/chat";

interface MessageListProps {
  messages: MessageType[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processedMessages = messages.map((message, index) => ({
    ...message,
    isLastInGroup: index === messages.length - 1 || messages[index + 1]?.sender !== message.sender
  }));
  
  return (
    <div className="flex-1 overflow-y-auto chat-scrollbar pb-32">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <Message key={message.id || index} {...message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;