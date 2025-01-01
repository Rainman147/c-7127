import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import EditorToolbar from './EditorToolbar';
import EditorActions from './EditorActions';

interface TiptapEditorProps {
  content: string;
  messageId?: string;  // Added messageId as optional prop
  isEditable?: boolean;
  onSave?: (content: string) => void;
  onCancel?: () => void;
}

const TiptapEditor = ({ 
  content, 
  messageId,  // Added messageId to props
  isEditable = false, 
  onSave, 
  onCancel 
}: TiptapEditorProps) => {
  console.log('[TiptapEditor] Rendering with:', { content, messageId, isEditable });
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: isEditable,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="prose prose-invert max-w-none">
      {isEditable && (
        <EditorToolbar editor={editor} />
      )}
      <EditorContent editor={editor} />
      {isEditable && (
        <EditorActions 
          editor={editor}
          onSave={() => onSave?.(editor.getHTML())}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default TiptapEditor;