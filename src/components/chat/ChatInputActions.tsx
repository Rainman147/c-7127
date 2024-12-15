import { Loader2, ArrowUp } from "lucide-react";
import AudioRecorder from "../AudioRecorder";
import FileUploadModal from "../FileUploadModal";

interface ChatInputActionsProps {
  isLoading: boolean;
  message: string;
  handleSubmit: () => void;
  onTranscriptionComplete: (text: string) => void;
  handleFileUpload: (file: File) => void;
}

const RecordingIndicator = () => {
  return (
    <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
      <div className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-1">
        Recording in session
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
      </div>
    </div>
  );
};

const ChatInputActions = ({
  isLoading,
  message,
  handleSubmit,
  onTranscriptionComplete,
  handleFileUpload
}: ChatInputActionsProps) => {
  // Track recording state
  const [isRecording, setIsRecording] = useState(false);

  // Handler for recording state changes
  const handleRecordingStateChange = (recording: boolean) => {
    console.log('Recording state changed:', recording);
    setIsRecording(recording);
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-2 bg-transparent">
      {/* Left side icons */}
      <div className="flex items-center space-x-2">
        <FileUploadModal 
          onFileSelected={handleFileUpload}
          onTranscriptionComplete={onTranscriptionComplete}
        />
      </div>
      
      {/* Right side icons */}
      <div className="flex items-center space-x-2">
        <AudioRecorder 
          onTranscriptionComplete={onTranscriptionComplete}
          onRecordingStateChange={handleRecordingStateChange}
        />
        <button 
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="p-2 bg-white rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-black animate-spin" />
          ) : (
            <ArrowUp className="h-5 w-5 text-black" />
          )}
        </button>
      </div>

      {/* Recording Indicator - only show when recording */}
      {isRecording && <RecordingIndicator />}
    </div>
  );
};

export default ChatInputActions;