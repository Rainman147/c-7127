import { useState } from "react";
import { Volume2, ThumbsUp, ThumbsDown, Copy, RotateCcw, MoreHorizontal, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

type MessageActionsProps = {
  content: string;
};

// Maximum length for each text chunk (characters)
const MAX_CHUNK_LENGTH = 4000;

const MessageActions = ({ content }: MessageActionsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const audioRef = useState<HTMLAudioElement | null>(null);

  const splitTextIntoChunks = (text: string): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';
    
    // Split by sentences to maintain natural breaks
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    console.log(`Split text into ${sentences.length} sentences`);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= MAX_CHUNK_LENGTH) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }
    
    if (currentChunk) chunks.push(currentChunk.trim());
    console.log(`Created ${chunks.length} chunks of text`);
    return chunks;
  };

  const handleTextToSpeech = async () => {
    try {
      if (isPlaying) {
        if (audioRef[0]) {
          audioRef[0].pause();
          audioRef[0].currentTime = 0;
        }
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      const textChunks = splitTextIntoChunks(content);
      console.log(`Processing ${textChunks.length} chunks of text`);

      // Process all chunks and combine their audio
      const audioChunks: ArrayBuffer[] = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        console.log(`Processing chunk ${i + 1}/${textChunks.length}, length: ${chunk.length} characters`);
        
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text: chunk }
        });

        if (error) {
          console.error('Supabase function error for chunk', i + 1, ':', error);
          throw error;
        }

        if (!data?.audio) {
          console.error('No audio data received for chunk', i + 1);
          throw new Error(`No audio data received for chunk ${i + 1}`);
        }

        try {
          // Convert base64 to audio buffer
          const audioData = atob(data.audio);
          const arrayBuffer = new ArrayBuffer(audioData.length);
          const view = new Uint8Array(arrayBuffer);
          for (let j = 0; j < audioData.length; j++) {
            view[j] = audioData.charCodeAt(j);
          }
          audioChunks.push(arrayBuffer);
          console.log(`Successfully processed chunk ${i + 1}, size: ${arrayBuffer.byteLength} bytes`);
        } catch (conversionError) {
          console.error('Error converting audio data for chunk', i + 1, ':', conversionError);
          throw new Error(`Failed to convert audio data for chunk ${i + 1}: ${conversionError.message}`);
        }
      }

      console.log('Combining audio chunks');
      // Combine all audio chunks
      const totalSize = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
      console.log(`Total audio size: ${totalSize} bytes`);
      
      const combinedBuffer = new Uint8Array(totalSize);
      
      let offset = 0;
      audioChunks.forEach((chunk, index) => {
        combinedBuffer.set(new Uint8Array(chunk), offset);
        console.log(`Added chunk ${index + 1} at offset ${offset}`);
        offset += chunk.byteLength;
      });

      const blob = new Blob([combinedBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      console.log('Created audio blob URL:', audioUrl);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef[0] = audio;

      audio.onplay = () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      };

      audio.onended = () => {
        console.log('Audio finished playing');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      };

      console.log('Starting audio playback');
      await audio.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate speech",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <button 
        className={`p-1 transition-colors ${isPlaying ? 'text-blue-500' : 'hover:text-white'}`}
        onClick={handleTextToSpeech}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <ThumbsDown className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <Copy className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button className="p-1 hover:text-white transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
};

export default MessageActions;