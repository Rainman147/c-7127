export type TemplateInstructions = {
  dataFormatting: string;
  priorityRules: string;
  specialConditions: string;
};

export type TemplateSchema = {
  sections: string[];
  requiredFields: string[];
};

export type BaseTemplate = {
  id: string;
  name: string;
  description: string;
  systemInstructions: string;
};

export type Template = BaseTemplate & {
  content: string;
  instructions: TemplateInstructions;
  schema: TemplateSchema;
  priority_rules?: any;
};

export interface CreateTemplateInput {
  name: string;
  description: string;
  systemInstructions: string;
  content: string;
  instructions: TemplateInstructions;
  schema: TemplateSchema;
}