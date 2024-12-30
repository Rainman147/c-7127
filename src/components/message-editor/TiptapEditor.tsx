import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditorToolbar from './EditorToolbar';
import EditorActions from './EditorActions';
import { logger, LogCategory } from '@/utils/logging';

interface TiptapEditorProps {
  content: string;
  messageId: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  editable?: boolean;
}

const TiptapEditor = ({ 
  content, 
  messageId, 
  onSave, 
  onCancel, 
  editable = true 
}: TiptapEditorProps) => {
  const { toast } = useToast();
  const [originalContent, setOriginalContent] = useState(content);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px] cursor-text touch-manipulation',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleSave = async () => {
    if (!editor) return;
    
    const newContent = editor.getHTML();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      logger.info(LogCategory.STATE, 'TiptapEditor', 'Saving edited message:', {
        messageId,
        contentLength: newContent.length
      });

      const { error } = await supabase
        .from('edited_messages')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          edited_content: newContent,
        }, {
          onConflict: 'message_id,user_id'
        });

      if (error) throw error;
      
      if (onSave) onSave(newContent);
      
      toast({
        description: "Changes saved successfully",
        duration: 2000,
        className: "bg-[#10A37F] text-white",
      });

      logger.info(LogCategory.STATE, 'TiptapEditor', 'Message saved successfully');
    } catch (error: any) {
      logger.error(LogCategory.ERROR, 'TiptapEditor', 'Error saving message:', error);
      
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRevertToOriginal = () => {
    if (!editor) return;
    
    logger.info(LogCategory.STATE, 'TiptapEditor', 'Reverting content to original');
    
    editor.commands.setContent(originalContent);
    toast({
      description: "Reverted to original content",
      duration: 2000,
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <EditorToolbar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
      />
      <EditorActions
        onSave={handleSave}
        onCancel={onCancel || (() => {})}
        onRevert={handleRevertToOriginal}
      />
    </div>
  );
};

export default TiptapEditor;