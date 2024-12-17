import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TiptapEditorProps {
  content: string;
  messageId: string;
  onSave?: (content: string) => void;
  editable?: boolean;
}

const TiptapEditor = ({ content, messageId, onSave, editable = true }: TiptapEditorProps) => {
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px]',
      },
    },
    onUpdate: ({ editor }) => {
      handleSave(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleSave = async (newContent: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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
      
    } catch (error: any) {
      console.error('Error saving edit:', error);
      toast({
        title: "Error saving changes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <EditorContent 
      editor={editor} 
      className="prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
    />
  );
};

export default TiptapEditor;