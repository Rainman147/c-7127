import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, X, RotateCcw, Bold, Italic, List, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TiptapEditorProps {
  content: string;
  messageId: string;
  onSave?: (content: string) => void;
  onCancel?: () => void;
  editable?: boolean;
}

const TiptapEditor = ({ content, messageId, onSave, onCancel, editable = true }: TiptapEditorProps) => {
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

  const handleRevertToOriginal = () => {
    if (!editor) return;
    editor.commands.setContent(originalContent);
    toast({
      description: "Reverted to original content",
      duration: 2000,
    });
  };

  const handleCopy = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getText());
    toast({
      description: "Content copied to clipboard",
      duration: 2000,
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-[#2A2A2A] p-2 rounded-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-[#10A37F]' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-[#10A37F]' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-[#10A37F]' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      
      <EditorContent 
        editor={editor} 
        className="prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="ghost"
          onClick={handleRevertToOriginal}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          Revert
        </Button>
        <Button
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-[#10A37F] text-white hover:bg-[#0D8A6A]"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
};

export default TiptapEditor;