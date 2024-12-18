import { Bold, Italic, List, Copy } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const { toast } = useToast();

  if (!editor) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editor.getText());
    toast({
      description: "Content copied to clipboard",
      duration: 2000,
    });
  };

  return (
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
  );
};

export default EditorToolbar;