import { Editor } from '@tiptap/react';
import { Check, X } from 'lucide-react';

interface EditorActionsProps {
  editor: Editor;
  onSave?: () => void;
  onCancel?: () => void;
}

const EditorActions = ({ editor, onSave, onCancel }: EditorActionsProps) => {
  console.log('[EditorActions] Rendering actions');
  
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button
        onClick={onCancel}
        className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        onClick={onSave}
        className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
};

export default EditorActions;