import React from "react";

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
  return (
    <div className="w-full">
      <textarea
        rows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message Claude"
        className="w-full resize-none bg-transparent px-4 py-4 focus:outline-none"
        style={{ maxHeight: "200px" }}
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatInputField;