export interface AudioPlayerState {
  isLoading: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
}

export interface AudioPlayerHookReturn extends AudioPlayerState {
  handlePlayback: () => Promise<void>;
  cleanup: () => void;
}