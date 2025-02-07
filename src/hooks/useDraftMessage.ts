
import { useState, useEffect } from 'react';

interface DraftState {
  message: string;
  templateId?: string;
  patientId?: string;
  timestamp: number;
}

const DRAFT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useDraftMessage = (templateId?: string, patientId?: string) => {
  const storageKey = `draft_${templateId || 'no-template'}_${patientId || 'no-patient'}`;
  
  // Initialize state from localStorage
  const [draftMessage, setDraftMessage] = useState<string>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const draft: DraftState = JSON.parse(stored);
      // Check if draft has expired
      if (Date.now() - draft.timestamp < DRAFT_TIMEOUT) {
        return draft.message;
      }
      // Clear expired draft
      localStorage.removeItem(storageKey);
    }
    return '';
  });

  // Update localStorage when draft changes
  useEffect(() => {
    if (draftMessage) {
      const draft: DraftState = {
        message: draftMessage,
        templateId,
        patientId,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [draftMessage, templateId, patientId, storageKey]);

  // Cleanup function to remove draft
  const clearDraft = () => {
    setDraftMessage('');
    localStorage.removeItem(storageKey);
  };

  return {
    draftMessage,
    setDraftMessage,
    clearDraft
  };
};
