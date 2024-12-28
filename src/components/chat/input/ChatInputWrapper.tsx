import React from 'react';
import { ConnectionStatusBar } from "../ConnectionStatusBar";
import ChatInputField from "./ChatInputField";
import ChatInputActions from "./ChatInputActions";

interface ChatInputWrapperProps {
  message: string;
  handleMessageChange: (message: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSubmit: () => void;
  handleTranscriptionComplete: (text: string) => void;
  handleFileUpload: (file: File) => void;
  inputDisabled: boolean;
  connectionState: any;
}

const ChatInputWrapper = ({
  message,
  handleMessageChange,
  handleKeyDown,
  handleSubmit,
  handleTranscriptionComplete,
  handleFileUpload,
  inputDisabled,
  connectionState
}: ChatInputWrapperProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E]/80 backdrop-blur-sm py-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative flex w-full flex-col items-center">
          <ConnectionStatusBar connectionState={connectionState} />
          <div className="w-full rounded-xl overflow-hidden bg-[#2F2F2F] border border-white/[0.05] shadow-lg">
            <ChatInputField
              message={message}
              setMessage={handleMessageChange}
              handleKeyDown={handleKeyDown}
              isLoading={inputDisabled}
              maxLength={4000}
            />
            <ChatInputActions
              isLoading={inputDisabled}
              message={message}
              handleSubmit={handleSubmit}
              onTranscriptionComplete={handleTranscriptionComplete}
              handleFileUpload={handleFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInputWrapper;