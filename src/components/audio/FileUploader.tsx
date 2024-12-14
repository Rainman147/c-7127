import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile } from '@/utils/audioUtils';

interface FileUploaderProps {
  onFileSelected: (blob: Blob) => void;
}

const FileUploader = ({ onFileSelected }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateAudioFile(file);
      onFileSelected(file);
    } catch (error: any) {
      toast({
        title: "File Error",
        description: error.message || "Failed to process audio file",
        variant: "destructive"
      });
      console.error('File upload error:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <input
      type="file"
      ref={fileInputRef}
      accept="audio/*"
      onChange={handleFileUpload}
      className="hidden"
    />
  );
};

export default FileUploader;