import { useState } from 'react';
import MessageAvatar from './MessageAvatar';
import MessageActions from './MessageActions';
import { cn } from '@/lib/utils';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

type MessageProps = {
  role: 'user' | 'assistant';
  content: string;
  speaker?: 'Physician' | 'Patient';
  timestamp?: string;
  confidence?: number;
  onEdit?: (newContent: string) => void;
};

const Message = ({ role, content, speaker, timestamp, confidence, onEdit }: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedContent);
    }
    setIsEditing(false);
  };

  const getSpeakerColor = (speaker?: string) => {
    switch (speaker) {
      case 'Physician':
        return 'text-blue-500';
      case 'Patient':
        return 'text-green-500';
      default:
        return '';
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '';
    if (confidence >= 0.8) return 'border-l-green-500';
    if (confidence >= 0.6) return 'border-l-yellow-500';
    return 'border-l-red-500';
  };

  return (
    <div className="py-6">
      <div className={`flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
        <MessageAvatar isAssistant={role === 'assistant'} />
        <div className={`flex-1 space-y-2 ${role === 'user' ? 'flex justify-end' : ''}`}>
          <div
            className={cn(
              'space-y-2',
              role === 'user' ? 'bg-gray-700/50 rounded-[20px] px-4 py-2 inline-block' : '',
              confidence && 'border-l-4',
              getConfidenceColor(confidence)
            )}
          >
            {speaker && (
              <div className={cn('text-sm font-semibold', getSpeakerColor(speaker))}>
                {speaker}:
              </div>
            )}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative group">
                {content}
                {onEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil2Icon className="h-4 w-4 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
            )}
            {timestamp && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
          {role === 'assistant' && <MessageActions />}
        </div>
      </div>
    </div>
  );
};

export default Message;