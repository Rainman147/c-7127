
import type { Message } from '@/types';

export const sortMessages = (msgs: Message[]): Message[] => {
  return [...msgs].sort((a, b) => {
    const timeComparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (timeComparison !== 0) return timeComparison;
    const aIndex = a.metadata?.sortIndex || 0;
    const bIndex = b.metadata?.sortIndex || 0;
    return aIndex - bIndex;
  });
};
