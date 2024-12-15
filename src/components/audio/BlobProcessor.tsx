interface BlobProcessorConfig {
  blob: Blob | null;
  onProcessingComplete: (text: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
}

class BlobProcessor {
  private config: BlobProcessorConfig;

  constructor(config: BlobProcessorConfig) {
    this.config = config;
  }

  async processBlob(audioBlob: Blob) {
    try {
      console.log('Processing audio blob:', { size: audioBlob.size, type: audioBlob.type });
      
      if (!audioBlob.size) {
        throw new Error('Empty audio data received');
      }
      
      if (!audioBlob.type.includes('audio/')) {
        throw new Error('Invalid audio format');
      }

      this.config.onProcessingStart();
      
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

      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(audioBlob);
      const base64Data = await base64Promise;

      // Process audio using Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { 
          audioData: base64Data,
          mimeType: audioBlob.type
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
      console.error('Error processing audio:', error);
      throw error;
    } finally {
      this.config.onProcessingEnd();
    }
  }
}

export default BlobProcessor;