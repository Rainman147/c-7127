import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { ChatContext } from '../types.ts';
import { createAppError, logError } from './errorHandler.ts';

const DEFAULT_INSTRUCTIONS = 'Process conversation using standard medical documentation format.';

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatMedications = (medications: string[] | null): string => {
  if (!medications?.length) return 'None';
  return medications.join(', ');
};

export async function assembleContext(
  supabase: ReturnType<typeof createClient>,
  chatId: string
): Promise<ChatContext> {
  console.log('[contextAssembler] Assembling context for chat:', chatId);
  
  try {
    // Parallel fetch of chat, template, and patient data
    const [chatResult, messagesResult] = await Promise.all([
      // Get chat with template type
      supabase
        .from('chats')
        .select('template_type, patient_id')
        .eq('id', chatId)
        .maybeSingle(),
      
      // Get recent message history
      supabase
        .from('messages')
        .select('content, role, type')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(10)
    ]);

    // Handle chat fetch error
    if (chatResult.error) {
      logError('contextAssembler', chatResult.error, { chatId });
      throw createAppError('Failed to fetch chat details', 'CHAT_ERROR', chatResult.error);
    }

    if (!chatResult.data) {
      throw createAppError('Chat not found', 'CHAT_ERROR');
    }

    // Get template instructions if exists (non-blocking)
    let systemInstructions = DEFAULT_INSTRUCTIONS;
    if (chatResult.data.template_type) {
      const { data: template } = await supabase
        .from('templates')
        .select('system_instructions')
        .eq('id', chatResult.data.template_type)
        .maybeSingle();
      
      if (template?.system_instructions) {
        systemInstructions = template.system_instructions;
      }
    }

    // Get patient context if exists (non-blocking)
    let patientContext = null;
    if (chatResult.data.patient_id) {
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('name, dob, medical_history, current_medications')
          .eq('id', chatResult.data.patient_id)
          .maybeSingle();

        if (patient) {
          patientContext = `Patient Information:
Name: ${patient.name}
Age: ${calculateAge(patient.dob)}
Medical History: ${patient.medical_history || 'None'}
Current Medications: ${formatMedications(patient.current_medications)}`.trim();
        }
      } catch (error) {
        // Log but don't fail if patient context fails
        logError('contextAssembler', error, { 
          chatId, 
          patientId: chatResult.data.patient_id 
        });
      }
    }

    // Handle message history
    const messageHistory = messagesResult.error ? [] : (messagesResult.data || []).map(msg => ({
      role: msg.role,
      content: msg.content,
      type: msg.type
    }));

    if (messagesResult.error) {
      // Log but don't fail if history fetch fails
      logError('contextAssembler', messagesResult.error, { chatId });
    }

    console.log('[contextAssembler] Context assembly complete:', {
      hasSystemInstructions: systemInstructions !== DEFAULT_INSTRUCTIONS,
      hasPatientContext: !!patientContext,
      messageCount: messageHistory.length
    });

    return {
      systemInstructions,
      patientContext,
      messageHistory
    };

  } catch (error) {
    logError('contextAssembler', error, { chatId });
    
    // If it's already an AppError, rethrow it
    if ((error as any).type) {
      throw error;
    }
    
    // Otherwise, wrap it in a CONTEXT_ERROR
    throw createAppError(
      'Failed to assemble chat context',
      'CONTEXT_ERROR',
      error
    );
  }
}
