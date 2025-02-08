
import type { Template } from '../Template';

export const referralTemplate: Template = {
  id: "referral",
  name: "Referral Letter",
  description: "Professional specialist referral documentation with emphasis on reason for referral and relevant clinical history.",
  systemInstructions: "Emphasize reason for referral, relevant history, and specific consultation requests.",
  content: "Standard referral letter template",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
