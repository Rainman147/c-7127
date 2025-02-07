
import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile } from '@/utils/audioUtils';
import { supabase } from '@/integrations/supabase/client';

interface FileUploaderProps {
  onFileSelected: (blob: Blob) => void;
}

const FileUploader = ({ onFileSelected }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateAudioFile(file);
      setIsUploading(true);
      
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }
      
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('audio_files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload audio file');
      }

      // Create a blob from the file for processing
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      
      // Record the upload in audio_chunks
      const { error: insertError } = await supabase
        .from('audio_chunks')
        .insert({
          user_id: user.id,
          session_id: timestamp.toString(),
          chunk_number: 1,
          total_chunks: 1,
          storage_path: filePath,
          original_filename: file.name,
          status: 'stored'
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error('Failed to record audio upload');
      }

      onFileSelected(blob);

      toast({
        title: "Upload Complete",
        description: "Your file has been uploaded successfully.",
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
      disabled={isUploading}
      className="hidden"
    />
  );
};

export default FileUploader;
