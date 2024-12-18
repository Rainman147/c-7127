export interface AudioPlayerState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

export interface AudioPlayerOptions {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: string) => void;
}