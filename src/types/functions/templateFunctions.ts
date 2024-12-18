import type { AIFunction } from './types';

export const templateFunctions: AIFunction[] = [
  {
    name: "createCustomTemplate",
    description: "Creates a new custom template for clinical documentation",
    parameters: [
      {
        name: "templateName",
        type: "string",
        description: "Name of the new template",
        required: true
      },
      {
        name: "sections",
        type: "array",
        description: "Array of section names to include in the template",
        required: true
      },
      {
        name: "systemInstructions",
        type: "string",
        description: "Special instructions for the AI when using this template",
        required: true
      }
    ],
    expectedOutput: {
      type: "object",
      description: "Created template object with ID and confirmation",
      example: {
        templateId: "uuid",
        name: "Custom SOAP Note",
        success: true
      }
    }
  }
];