import { Textarea } from "@/components/ui/textarea";

interface InstructionField {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

interface TemplateInstructionsInputProps {
  fields: InstructionField[];
}

export const TemplateInstructionsInput = ({ fields }: TemplateInstructionsInputProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Instructions</h3>
      {fields.map((field) => (
        <div key={field.label}>
          <label className="block text-sm font-medium mb-1">{field.label}</label>
          <Textarea
            placeholder={field.placeholder}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            rows={3}
          />
        </div>
      ))}
    </div>
  );
};