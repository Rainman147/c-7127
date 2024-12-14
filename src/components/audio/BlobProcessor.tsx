import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BlobProcessorProps {
  blob: Blob | null;
  onProcessingComplete: (text: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
}

const BlobProcessor = ({
  blob,
  onProcessingComplete,
  onProcessingStart,
  onProcessingEnd
}: BlobProcessorProps) => {
  const { toast } = useToast();

  const processBlob = async (audioBlob: Blob) => {
    try {
      console.log('Processing audio blob:', { size: audioBlob.size, type: audioBlob.type });
      
      if (!audioBlob.size) {
        throw new Error('Empty audio data received');
      }
      
      if (!audioBlob.type.includes('audio/')) {
        throw new Error('Invalid audio format');
      }

      onProcessingStart();
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a file path with user ID as folder
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.wav`;
      
      console.log('Uploading file to path:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio_files')
        .upload(fileName, audioBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'audio/wav'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      console.log('Audio file uploaded successfully:', fileName);

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audioPath: fileName }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription received:', data.transcription);
        onProcessingComplete(data.transcription);
      } else {
        throw new Error('No transcription received from the server');
      }

    } catch (error: any) {
      console.error('Error processing audio:', error);
      toast({
        title: "Audio Processing Error",
        description: error.message || "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      onProcessingEnd();
    }
  };

  if (blob) {
    processBlob(blob);
  }

  return null;
};

export default BlobProcessor;