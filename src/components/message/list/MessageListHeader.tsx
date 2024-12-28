import { memo } from 'react';
import { ConnectionStatus } from '../ConnectionStatus';

export const MessageListHeader = memo(() => {
  return (
    <div className="sticky top-0 z-10 bg-chatgpt-main/95 backdrop-blur">
      <ConnectionStatus />
    </div>
  );
});

MessageListHeader.displayName = 'MessageListHeader';