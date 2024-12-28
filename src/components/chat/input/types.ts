export interface ChatInputFieldProps {
  message: string;
  setMessage: (newMessage: string) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => Promise<void>;
  isLoading: boolean;
  characterLimit?: number;
}

export interface ChatInputActionsProps {
  isLoading: boolean;
  message: string;
  handleSubmit: () => Promise<void>;
  onTranscriptionComplete: (text: string) => void;
  handleFileUpload: (file: File) => Promise<void>;
}