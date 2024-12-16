import { FileAudio, Mic } from 'lucide-react';

interface ActionButtonsProps {
  onTranscriptionComplete: (text: string) => void;
}

const ActionButtons = ({ onTranscriptionComplete }: ActionButtonsProps) => {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mt-8">
      <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-chatgpt-hover hover:bg-chatgpt-selected transition-colors">
        <Mic className="h-6 w-6" />
        <span>Record Audio</span>
      </button>
      <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-chatgpt-hover hover:bg-chatgpt-selected transition-colors">
        <FileAudio className="h-6 w-6" />
        <span>Upload Audio</span>
      </button>
    </div>
  );
};

export default ActionButtons;