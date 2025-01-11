import { DbMessage, MessageMetadata } from '@/types/message';

export const extractMetadata = (dbMessage: DbMessage): MessageMetadata => {
  console.log('[extractMetadata] Extracting metadata for message:', dbMessage.id);
  return {
    sequence: dbMessage.sequence,
    deliveredAt: dbMessage.delivered_at,
    seenAt: dbMessage.seen_at
  };
};