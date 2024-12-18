import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import type { FunctionResponse } from '../types.ts'

export async function handleCreateTemplate(
  parameters: Record<string, unknown>,
  userId: string,
  supabaseClient: any
): Promise<FunctionResponse> {
  const { templateName, sections, systemInstructions } = parameters as {
    templateName: string;
    sections: string[];
    systemInstructions: string;
  }

  if (!templateName || !sections) {
    throw new Error('Missing required parameters')
  }

  try {
    // Create template logic here
    console.log('Creating template:', { templateName, sections, userId })
    return {
      success: true,
      data: {
        templateId: crypto.randomUUID(),
        name: templateName
      }
    }
  } catch (error) {
    console.error('Error creating template:', error)
    return {
      success: false,
      error: error.message
    }
  }
}