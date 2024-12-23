import { useEffect, useState } from 'react';

export const useTypingEffect = (
  role: 'user' | 'assistant',
  isStreaming: boolean | undefined,
  content: string
) => {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (role === 'assistant' && isStreaming) {
      setIsTyping(true);
      // Simulate natural typing timing
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
      }, content.length * 50); // Adjust timing based on content length

      return () => clearTimeout(typingTimeout);
    }
  }, [role, isStreaming, content]);

  return { isTyping };
};