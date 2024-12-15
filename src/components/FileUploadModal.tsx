import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileAudio, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { validateAudioFile } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';
import FileProcessor from './audio/FileProcessor';

interface FileUploadModalProps {
  onFileSelected: (file: File) => void;
}

const FileUploadModal = ({ onFileSelected }: FileUploadModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (!file) return;

    try {
      // Validate the audio file
      validateAudioFile(file);
      
      console.log('Processing uploaded audio file:', { 
        type: file.type,
        size: file.size
      });

      // Create FileProcessor instance
      const processor = new FileProcessor({
        onProcessingComplete: (text) => {
          console.log('Transcription complete:', text);
          onFileSelected(file);
          setIsOpen(false);
          setIsProcessing(false);
          
          toast({
            title: "Transcription complete",
            description: "Your audio file has been processed successfully.",
          });
        },
        onProcessingStart: () => setIsProcessing(true),
        onProcessingEnd: () => setIsProcessing(false)
      });
      
      // Process the file
      await processor.processFile(file);
      
    } catch (error: any) {
      setError(error.message);
      console.error('File processing error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to process audio file",
        variant: "destructive"
      });
    } finally {
      if (event.target.value) {
        event.target.value = '';
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          aria-label="Upload file"
        >
          <Upload className="h-5 w-5 text-gray-700" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="sm:max-w-[425px] mx-auto rounded-t-xl bg-chatgpt-main border-chatgpt-border"
      >
        <SheetHeader>
          <SheetTitle className="text-white">Upload File</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="audio" className="mt-6">
          <TabsList className="bg-chatgpt-secondary/50">
            <TabsTrigger value="audio" className="data-[state=active]:bg-chatgpt-hover">
              <FileAudio className="h-4 w-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-chatgpt-hover" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
            <TabsTrigger value="image" className="data-[state=active]:bg-chatgpt-hover" disabled>
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="audio" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-white/70">
                Supported formats: MP3, WAV, FLAC (up to 100MB)
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-chatgpt-border border-dashed rounded-lg cursor-pointer bg-chatgpt-secondary/30 hover:bg-chatgpt-secondary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-white/70 mb-2" />
                  <p className="mb-2 text-sm text-white/90">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-white/70">Maximum file size: 100MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
              
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70" />
                  Processing audio...
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="mt-4">
            <div className="text-sm text-white/70">
              Text file upload coming soon...
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="mt-4">
            <div className="text-sm text-white/70">
              Image upload coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default FileUploadModal;
