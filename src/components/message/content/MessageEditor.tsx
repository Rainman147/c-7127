import TiptapEditor from '../../message-editor/TiptapEditor';
import { Loader2 } from 'lucide-react';
import { logger, LogCategory } from '@/utils/logging';

interface MessageEditorProps {
  content: string;
  messageId: string;
  isSaving: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const MessageEditor = ({
  content,
  messageId,
  isSaving,
  onSave,
  onCancel
}: MessageEditorProps) => {
  logger.debug(LogCategory.RENDER, 'MessageEditor', 'Rendering editor:', {
    messageId,
    contentPreview: content?.substring(0, 50),
    isSaving
  });

  return (
    <div className="border border-[#10A37F] rounded-md p-4 bg-[#3A3A3A]">
      <TiptapEditor 
        content={content} 
        messageId={messageId}
        onSave={onSave}
        onCancel={onCancel}
        editable={!isSaving}
      />
      {isSaving && (
        <div className="flex items-center justify-center mt-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Saving changes...
        </div>
      )}
    </div>
  );
};

export default MessageEditor;