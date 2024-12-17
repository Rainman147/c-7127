import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ModelType = 'gemini' | 'gpt4o' | 'gpt4o-mini';

interface ModelSelectorProps {
  currentModel: ModelType;
  onModelChange: (model: ModelType) => void;
  isDisabled?: boolean;
}

const ModelSelector = ({ currentModel, onModelChange, isDisabled }: ModelSelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Model:</span>
      <Select
        value={currentModel}
        onValueChange={(value) => onModelChange(value as ModelType)}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini">Google Gemini</SelectItem>
          <SelectItem value="gpt4o">GPT-4 Optimized</SelectItem>
          <SelectItem value="gpt4o-mini">GPT-4 Mini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector;