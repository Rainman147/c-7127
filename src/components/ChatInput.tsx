import ChatInputContainer from "./chat/ChatInputContainer";

interface ChatInputProps {
  onSend: (message: string, type?: 'text' | 'audio') => Promise<any>;
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionUpdate?: (text: string) => void;
  isLoading?: boolean;
}

const ChatInput = (props: ChatInputProps) => {
  return <ChatInputContainer {...props} />;
};

export default ChatInput;