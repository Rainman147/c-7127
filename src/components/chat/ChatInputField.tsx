import React, { useEffect, useRef } from "react";

interface ChatInputFieldProps {
  message: string;
  setMessage: (message: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}

const ChatInputField = ({ 
  message, 
  setMessage, 
  handleKeyDown,
  isLoading 
}: ChatInputFieldProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="w-full">
      <textarea
        ref={textareaRef}
        rows={1}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          adjustTextareaHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message DocTation"
        className="w-full min-h-[40px] max-h-[200px] resize-none bg-transparent px-4 py-3 focus:outline-none overflow-y-auto transition-all duration-150 ease-in-out chat-input-scrollbar"
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatInputField;