import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateAudioFile } from '@/utils/audioUtils';
import { createChunks, calculateProgress } from '@/utils/fileChunking';
import { supabase } from '@/integrations/supabase/client';

interface FileUploaderProps {
  onFileSelected: (blob: Blob) => void;
}

const FileUploader = ({ onFileSelected }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleChunkUpload = async (
    chunk: Blob,
    chunkNumber: number,
    sessionId: string
  ) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('chunkNumber', chunkNumber.toString());
    formData.append('chunk', chunk);

    const { data, error } = await supabase.functions.invoke('upload-chunk', {
      body: formData
    });

    if (error) {
      throw error;
    }

    return data;
  };

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
      
      // Create upload session
      const { data: session, error: sessionError } = await supabase
        .from('file_upload_sessions')
        .insert({
          original_filename: file.name,
          content_type: file.type,
          total_size: file.size,
          total_chunks: Math.ceil(file.size / (5 * 1024 * 1024)),
          user_id: user.id
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Split file into chunks and upload
      const { chunks, totalChunks } = createChunks(file);
      console.log(`Uploading file in ${totalChunks} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        await handleChunkUpload(chunks[i], i, session.id);
        const progress = calculateProgress(i + 1, totalChunks);
        setUploadProgress(progress);
      }

      // Get the completed file
      const { data: uploadSession } = await supabase
        .from('file_upload_sessions')
        .select()
        .eq('id', session.id)
        .single();

      if (uploadSession?.status === 'completed') {
        // Combine chunks and process
        const response = await supabase.functions.invoke('combine-chunks', {
          body: { sessionId: session.id }
        });

        if (response.data?.blob) {
          onFileSelected(new Blob([response.data.blob], { type: file.type }));
        }
      }

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
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Uploading File</h3>
                <p className="text-sm text-muted-foreground">
                  {uploadProgress}% complete
                </p>
              </div>
              <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploader;