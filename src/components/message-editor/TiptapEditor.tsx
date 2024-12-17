import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  messageId: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  editable?: boolean;
}

const TiptapEditor = ({ content, messageId, onSave, onCancel, editable = true }: TiptapEditorProps) => {
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
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
    <div>
      <EditorContent 
        editor={editor} 
        className="prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 touch-manipulation"
      />
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-[#10A37F] text-white rounded hover:bg-[#0D8A6A] transition-colors"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
};

export default TiptapEditor;