import { supabase } from '@/integrations/supabase/client';

interface FileProcessorConfig {
  onProcessingComplete: (text: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
}

class FileProcessor {
  private config: FileProcessorConfig;

  constructor(config: FileProcessorConfig) {
    this.config = config;
  }

  async processFile(file: File) {
    try {
      console.log('Processing uploaded audio file:', { 
        type: file.type, 
        size: file.size 
      });

      this.config.onProcessingStart();
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a file path with user ID as folder
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}_${file.name}`;
      
      console.log('Uploading file to path:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      console.log('Audio file uploaded successfully:', fileName);

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: file.type
        }
      });

      if (error) {
        console.error('Processing error:', error);
        throw error;
      }

      if (data?.transcription) {
        console.log('Transcription received:', data.transcription);
        this.config.onProcessingComplete(data.transcription);
      } else {
        throw new Error('No transcription received from the server');
      }

    } catch (error: any) {
      console.error('Error processing audio file:', error);
      throw error;
    } finally {
      this.config.onProcessingEnd();
    }
  }
}

export default FileProcessor;