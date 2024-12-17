export type AudioButtonProps = {
  content: string;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioRef: [HTMLAudioElement | null, (audio: HTMLAudioElement | null) => void];
};