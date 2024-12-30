import { createContext, useContext, useReducer, ReactNode } from 'react';
import { messageReducer, initialState } from './message/messageReducer';
import { useMessageOperations } from '@/hooks/message/useMessageOperations';
import { useMessageStateUpdates } from '@/hooks/message/useMessageStateUpdates';
import type { MessageContextType } from '@/types/messageContext';
import type { Message } from '@/types/chat';

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const operations = useMessageOperations();
  const stateUpdates = useMessageStateUpdates(dispatch);

  const value: MessageContextType = {
    ...state,
    ...operations,
    ...stateUpdates,
    retryMessage: async (messageId: string) => {
      dispatch({ type: 'RETRY_MESSAGE', payload: { messageId } });
    },
    clearMessages: () => {
      dispatch({ type: 'CLEAR_MESSAGES' });
    },
    retryLoading: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },
    confirmMessage: (tempId: string, confirmedMessage: Message) => {
      dispatch({ type: 'CONFIRM_MESSAGE', payload: { tempId, confirmedMessage } });
    },
    handleMessageFailure: (messageId: string, error: string) => {
      dispatch({ type: 'HANDLE_MESSAGE_FAILURE', payload: { messageId, error } });
    }
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};