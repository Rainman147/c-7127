import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Code,
  Heading1,
  Heading2
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  console.log('[EditorToolbar] Rendering toolbar');
  
  return (
    <div className="border-b border-gray-600 mb-4 pb-2 flex gap-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('bold') ? 'bg-gray-700' : ''}`}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('italic') ? 'bg-gray-700' : ''}`}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('bulletList') ? 'bg-gray-700' : ''}`}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('orderedList') ? 'bg-gray-700' : ''}`}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('codeBlock') ? 'bg-gray-700' : ''}`}
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''}`}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 hover:bg-gray-700 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''}`}
      >
        <Heading2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default EditorToolbar;