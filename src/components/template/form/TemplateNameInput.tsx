import { Input } from "@/components/ui/input";

interface TemplateNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TemplateNameInput = ({ value, onChange }: TemplateNameInputProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Template Name</label>
      <Input
        placeholder="Template Name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};