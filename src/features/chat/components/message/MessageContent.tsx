
import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { MessageType } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism } from 'prism-react-renderer';
import { themes } from 'prism-react-renderer';

interface MessageContentProps {
  content: string;
  type?: MessageType;
  isAssistant: boolean;
}

const MessageContent = ({ content, type = 'text', isAssistant }: MessageContentProps) => {
  console.log('[MessageContent] Rendering with type:', type);

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      "leading-7 text-white",
      !isAssistant && "bg-gray-700/50 rounded-[20px] px-4 py-3",
      type === 'audio' && "italic text-gray-400",
      isAssistant && "space-y-6"
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (inline) {
              return (
                <code {...props} className={cn(className, "bg-gray-800 rounded px-1")}>
                  {children}
                </code>
              );
            }

            return (
              <Prism
                {...props}
                theme={themes.nightOwl}
                language={language}
                style={{
                  margin: '1em 0',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                }}
              >
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                  <pre className={className} style={style}>
                    {tokens.map((line, i) => (
                      <div key={i} {...getLineProps({ line })}>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </div>
                    ))}
                  </pre>
                )}
              </Prism>
            );
          },
          // Style links
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              {...props} 
              className="border-l-4 border-gray-600 pl-4 italic my-4"
            />
          ),
          // Style tables
          table: ({ node, ...props }) => (
            <table {...props} className="border-collapse table-auto w-full text-sm" />
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="border border-gray-600 px-4 py-2 text-left" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="border border-gray-600 px-4 py-2" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default memo(MessageContent);
