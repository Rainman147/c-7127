export interface AudioPlayerHookReturn {
  isLoading: boolean;
  isPlaying: boolean;
  isProcessing: boolean;
  handlePlayback: () => Promise<void>;
  cleanup: () => void;
}