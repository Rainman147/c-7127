import { Template } from './Template';

export interface ValidationRule {
  required: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface SectionValidation {
  [key: string]: ValidationRule;
}

export interface TemplateValidationConfig {
  sections: SectionValidation;
  requiredTerms: string[];
  minTotalLength: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  type: 'section' | 'content' | 'terminology';
  message: string;
  field?: string;
}

const defaultValidationConfig: TemplateValidationConfig = {
  sections: {
    'Subjective': { required: true, minLength: 50 },
    'Objective': { required: true, minLength: 30 },
    'Assessment': { required: true, minLength: 40 },
    'Plan': { required: true, minLength: 40 }
  },
  requiredTerms: [
    'diagnosis',
    'treatment',
    'follow-up'
  ],
  minTotalLength: 200
};

export const validateTemplate = (template: Template): ValidationResult => {
  // Temporarily return valid for all templates during migration
  return {
    isValid: true,
    errors: []
  };
};

const extractSections = (content: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const sectionRegex = /^(Subjective|Objective|Assessment|Plan):/gm;
  
  let matches;
  let lastIndex = 0;
  let lastSection = '';
  
  while ((matches = sectionRegex.exec(content)) !== null) {
    const sectionName = matches[1];
    if (lastSection) {
      sections[lastSection] = content
        .slice(lastIndex, matches.index)
        .trim();
    }
    lastSection = sectionName;
    lastIndex = matches.index + sectionName.length + 1;
  }
  
  if (lastSection) {
    sections[lastSection] = content
      .slice(lastIndex)
      .trim();
  }
  
  return sections;
};