import { Textarea } from "@/components/ui/textarea";

interface TemplateContentInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const TemplateContentInput = ({ value, onChange }: TemplateContentInputProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Template Content</label>
      <Textarea
        placeholder="Template Content"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
      />
    </div>
  );
};