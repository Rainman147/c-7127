import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { Loader2, Mic } from 'lucide-react';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  type?: 'text' | 'audio';
};

const Message = ({ role, content, isStreaming, type }: MessageProps) => {
  // Function to format the content with proper spacing and styling
  const formatContent = (text: string) => {
    // Split content into sections based on common medical note headers
    const sections = text.split(/(?=(?:[A-Z][a-z]* )*(?:Complaint|History|Medications|Signs|Assessment|Plan|Education):)/g);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      // Split the section into title and content
      const [title, ...contentParts] = section.split(':');
      const sectionContent = contentParts.join(':').trim();
      
      return (
        <div key={index} className="mb-4 last:mb-0">
          {title && (
            <h3 className="font-bold text-gray-200 mb-2">
              {title.trim()}:
            </h3>
          )}
          <div className="pl-4 whitespace-pre-wrap">
            {/* Split paragraphs and add spacing */}
            {sectionContent.split('\n').map((paragraph, pIndex) => (
              <p 
                key={pIndex} 
                className={`mb-2 last:mb-0 ${
                  paragraph.startsWith('-') ? 'pl-2' : ''
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="py-6">
      <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isAssistant={role === 'assistant'} />
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex justify-end' : ''}`}>
          <div 
            className={`${
              role === 'user' 
                ? 'bg-gray-700/50 rounded-[20px] px-4 py-2 inline-block' 
                : 'prose prose-invert max-w-none'
            }`}
          >
            {type === 'audio' && (
              <span className="inline-flex items-center gap-2 mr-2 text-gray-400">
                <Mic className="h-4 w-4" />
              </span>
            )}
            {role === 'assistant' ? (
              <div className="text-gray-200">
                {formatContent(content)}
              </div>
            ) : (
              content
            )}
            {isStreaming && (
              <div className="inline-flex items-center gap-2 ml-2 text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Transcribing...</span>
              </div>
            )}
          </div>
          {role === 'assistant' && <MessageActions content={content} />}
        </div>
      </div>
    </div>
  );
};

export default Message;