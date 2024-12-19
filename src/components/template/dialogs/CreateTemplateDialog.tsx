import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateNameInput } from "../form/TemplateNameInput";
import { TemplateContentInput } from "../form/TemplateContentInput";
import { TemplateInstructionsInput } from "../form/TemplateInstructionsInput";

interface CreateTemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    content: string;
    instructions: {
      dataFormatting: string;
      priorityRules: string;
      specialConditions: string;
    };
  };
  onInputChange: (field: string, value: string) => void;
  onInstructionChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

export const CreateTemplateDialog = ({
  isOpen,
  onOpenChange,
  formData,
  onInputChange,
  onInstructionChange,
  onSubmit,
}: CreateTemplateDialogProps) => {
  const instructionFields = [
    {
      label: "Data Formatting",
      value: formData.instructions.dataFormatting,
      placeholder: "Specify data formatting requirements...",
      onChange: (value: string) => onInstructionChange("dataFormatting", value),
    },
    {
      label: "Priority Rules",
      value: formData.instructions.priorityRules,
      placeholder: "Define priority rules...",
      onChange: (value: string) => onInstructionChange("priorityRules", value),
    },
    {
      label: "Special Conditions",
      value: formData.instructions.specialConditions,
      placeholder: "Specify any special conditions...",
      onChange: (value: string) => onInstructionChange("specialConditions", value),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="menu-dialog">
        <DialogHeader className="menu-dialog-header">
          <DialogTitle className="menu-dialog-title">Create New Template</DialogTitle>
        </DialogHeader>
        <div className="menu-dialog-content">
          <div className="space-y-4">
            <TemplateNameInput
              value={formData.name}
              onChange={(value) => onInputChange("name", value)}
            />
            <TemplateContentInput
              value={formData.content}
              onChange={(value) => onInputChange("content", value)}
            />
            <TemplateInstructionsInput fields={instructionFields} />
            <Button onClick={onSubmit} className="w-full">
              Create Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};