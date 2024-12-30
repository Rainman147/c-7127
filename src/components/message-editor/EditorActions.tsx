import { Save, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger, LogCategory } from '@/utils/logging';

interface EditorActionsProps {
  onSave: () => void;
  onCancel: () => void;
  onRevert: () => void;
}

const EditorActions = ({ onSave, onCancel, onRevert }: EditorActionsProps) => {
  const handleSave = () => {
    logger.info(LogCategory.STATE, 'EditorActions', 'Save button clicked');
    onSave();
  };

  const handleCancel = () => {
    logger.info(LogCategory.STATE, 'EditorActions', 'Cancel button clicked');
    onCancel();
  };

  const handleRevert = () => {
    logger.info(LogCategory.STATE, 'EditorActions', 'Revert button clicked');
    onRevert();
  };

  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button
        variant="ghost"
        onClick={handleCancel}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
        Cancel
      </Button>
      <Button
        variant="ghost"
        onClick={handleRevert}
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
  );
};

export default EditorActions;