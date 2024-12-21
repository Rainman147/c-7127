import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { TemplateNameInput } from "./TemplateNameInput";
import { TemplateContentInput } from "./TemplateContentInput";
import { TemplateInstructionsInput } from "./TemplateInstructionsInput";
import type { CreateTemplateInput } from '@/types/templates/base';

interface CreateTemplateFormProps {
  onSubmit: (formData: CreateTemplateInput) => Promise<boolean>;
}

export const CreateTemplateForm = ({ onSubmit }: CreateTemplateFormProps) => {
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: '',
    description: '',
    systemInstructions: '',
    content: '',
    instructions: {
      dataFormatting: '',
      priorityRules: '',
      specialConditions: '',
    },
    schema: {
      sections: [],
      requiredFields: [],
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInstructionChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: {
        ...prev.instructions,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        name: '',
        description: '',
        systemInstructions: '',
        content: '',
        instructions: {
          dataFormatting: '',
          priorityRules: '',
          specialConditions: '',
        },
        schema: {
          sections: [],
          requiredFields: [],
        },
      });
    }
  };

  const instructionFields = [
    {
      label: "Data Formatting",
      value: formData.instructions.dataFormatting,
      placeholder: "Specify data formatting requirements...",
      onChange: (value: string) => handleInstructionChange("dataFormatting", value),
    },
    {
      label: "Priority Rules",
      value: formData.instructions.priorityRules,
      placeholder: "Define priority rules...",
      onChange: (value: string) => handleInstructionChange("priorityRules", value),
    },
    {
      label: "Special Conditions",
      value: formData.instructions.specialConditions,
      placeholder: "Specify any special conditions...",
      onChange: (value: string) => handleInstructionChange("specialConditions", value),
    },
  ];

  return (
    <div className="space-y-4">
      <TemplateNameInput
        value={formData.name}
        onChange={(value) => handleInputChange("name", value)}
      />
      <TemplateContentInput
        value={formData.content}
        onChange={(value) => handleInputChange("content", value)}
      />
      <TemplateInstructionsInput fields={instructionFields} />
      <Button onClick={handleSubmit} className="w-full">
        Create Template
      </Button>
    </div>
  );
};