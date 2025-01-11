import { useCallback } from 'react';

export const useTranscriptionHandler = () => {
  const handleTranscriptionComplete = useCallback((text: string) => {
    console.log('[useTranscriptionHandler] Transcription complete, ready for user to edit:', text);
    if (text) {
      const chatInput = document.querySelector('textarea');
      if (chatInput) {
        (chatInput as HTMLTextAreaElement).value = text;
        const event = new Event('input', { bubbles: true });
        chatInput.dispatchEvent(event);
      }
    }
  }, []);

  return {
    handleTranscriptionComplete
  };
};