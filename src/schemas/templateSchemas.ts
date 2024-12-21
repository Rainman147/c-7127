import { z } from "zod";

export const templateInstructionsSchema = z.object({
  dataFormatting: z.string().min(1, "Data formatting instructions are required"),
  priorityRules: z.string().min(1, "Priority rules are required"),
  specialConditions: z.string().min(1, "Special conditions are required"),
});

export const templateSchemaSchema = z.object({
  sections: z.array(z.string()).min(1, "At least one section is required"),
  requiredFields: z.array(z.string()).min(1, "At least one required field is needed"),
});

export const templateSchema = z.object({
  name: z.string().min(3, "Template name must be at least 3 characters"),
  content: z.string().min(10, "Template content must be at least 10 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  systemInstructions: z.string().min(10, "System instructions must be at least 10 characters"),
  instructions: templateInstructionsSchema,
  schema: templateSchemaSchema,
});

export type TemplateValidationSchema = z.infer<typeof templateSchema>;