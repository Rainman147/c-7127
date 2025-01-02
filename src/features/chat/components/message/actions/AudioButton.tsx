import { useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { getDeviceType } from '@/utils/deviceDetection';
import type { AudioButtonProps } from '../types';

export const AudioButton = ({ content, isPlaying, setIsPlaying, audioRef }: AudioButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isIOS } = getDeviceType();

  const handleTextToSpeech = async () => {
    try {
      console.log('[TTS] Starting text-to-speech process');
      console.log('[TTS] Device type:', { isIOS });
      
      if (isPlaying) {
        console.log('[TTS] Stopping current playback');
        if (audioRef[0]) {
          audioRef[0].pause();
          audioRef[0].currentTime = 0;
        }
        setIsPlaying(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: content }
      });

      if (error) throw error;
      if (!data?.audio) throw new Error('No audio data received');

      // Convert base64 to audio buffer
      const audioData = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let j = 0; j < audioData.length; j++) {
        view[j] = audioData.charCodeAt(j);
      }

      const blob = new Blob([arrayBuffer], { type: isIOS ? 'audio/mp4' : 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef[0] = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('[TTS] Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
        toast({
          title: "Error",
          description: `Failed to play audio: ${audio.error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error: any) {
      console.error('[TTS] Text-to-speech error:', error);
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
  );
};