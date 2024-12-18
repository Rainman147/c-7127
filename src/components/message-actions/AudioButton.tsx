import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AudioPlaybackButton } from "./audio/AudioPlaybackButton";
import { supabase } from "@/integrations/supabase/client";

export const AudioButton = ({ content }: { content: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();
  const audioRef = new Audio();

  const handleTextToSpeech = async () => {
    // If already playing, stop playback
    if (isPlaying) {
      console.log('[AudioButton] Stopping playback');
      audioRef.pause();
      audioRef.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[AudioButton] Starting text-to-speech process');

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: content }
      });

      if (error) {
        throw new Error(`API Error: ${error.message}`);
      }

      if (!data?.audio) {
        throw new Error('No audio data received');
      }

      console.log('[AudioButton] Received audio data, preparing playback');

      // Convert base64 to audio
      const audioData = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Set up audio element
      audioRef.src = audioUrl;
      audioRef.onplay = () => {
        console.log('[AudioButton] Audio playback started');
        setIsPlaying(true);
      };
      audioRef.onended = () => {
        console.log('[AudioButton] Audio playback completed');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.onerror = (e) => {
        console.error('[AudioButton] Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Unable to play audio. Please try again later.",
          variant: "destructive",
        });
      };

      await audioRef.play();
      
    } catch (error: any) {
      console.error('[AudioButton] Error in text-to-speech process:', error);
      toast({
        title: "Error",
        description: "Unable to generate audio. Please try again later.",
        variant: "destructive",
      });
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AudioPlaybackButton 
      isLoading={isLoading}
      isPlaying={isPlaying}
      onClick={handleTextToSpeech}
    />
  );
};