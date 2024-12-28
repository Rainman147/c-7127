import { useEffect, useState } from 'react';

export const useMessageTypingEffect = (
  role: 'user' | 'assistant',
  isStreaming: boolean | undefined,
  content: string
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (role === 'assistant' && isStreaming) {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, content.length * 50);

      return () => clearTimeout(typingTimeout);
    }
  }, [role, isStreaming, content]);

  return { isTyping };
};