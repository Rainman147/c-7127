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
  const errors: ValidationError[] = [];
  const config = defaultValidationConfig;

  // Validate required fields
  if (!template.name?.trim()) {
    errors.push({
      type: 'content',
      message: 'Template name is required',
      field: 'name'
    });
  }

  if (!template.description?.trim()) {
    errors.push({
      type: 'content',
      message: 'Template description is required',
      field: 'description'
    });
  }

  if (!template.systemInstructions?.trim()) {
    errors.push({
      type: 'content',
      message: 'System instructions are required',
      field: 'systemInstructions'
    });
  }

  // Validate content length
  if (template.systemInstructions && 
      template.systemInstructions.length < config.minTotalLength) {
    errors.push({
      type: 'content',
      message: `System instructions must be at least ${config.minTotalLength} characters`,
      field: 'systemInstructions'
    });
  }

  // Validate required terminology
  for (const term of config.requiredTerms) {
    if (!template.systemInstructions?.toLowerCase().includes(term.toLowerCase())) {
      errors.push({
        type: 'terminology',
        message: `Required term "${term}" is missing from system instructions`,
        field: 'systemInstructions'
      });
    }
  }

  // Validate sections
  const sections = extractSections(template.systemInstructions || '');
  for (const [sectionName, rule] of Object.entries(config.sections)) {
    const sectionContent = sections[sectionName];
    
    if (rule.required && !sectionContent) {
      errors.push({
        type: 'section',
        message: `Required section "${sectionName}" is missing`,
        field: sectionName
      });
      continue;
    }

    if (sectionContent && rule.minLength && sectionContent.length < rule.minLength) {
      errors.push({
        type: 'section',
        message: `Section "${sectionName}" must be at least ${rule.minLength} characters`,
        field: sectionName
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
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