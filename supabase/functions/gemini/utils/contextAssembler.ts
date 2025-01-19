import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatContext } from '../types.ts';

export async function assembleContext(supabase: any, chatId: string): Promise<ChatContext> {
  console.log('Assembling simplified context for chat:', chatId);
  
  // Get chat details (template_type and patient_id)
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('template_type, patient_id')
    .eq('id', chatId)
    .maybeSingle();

  if (chatError) {
    console.error('Error fetching chat:', chatError);
    throw new Error('Failed to fetch chat details');
  }

  // Get system instructions from templates
  let templateInstructions = '';
  if (chat?.template_type) {
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('system_instructions')
      .eq('id', chat.template_type)
      .maybeSingle();

    if (templateError) {
      console.error('Error fetching template:', templateError);
    } else if (template) {
      templateInstructions = template.system_instructions;
    }
  }

  // Get patient context if available
  let patientContext = '';
  if (chat?.patient_id) {
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, dob, medical_history, current_medications')
      .eq('id', chat.patient_id)
      .maybeSingle();

    if (patientError) {
      console.error('Error fetching patient:', patientError);
    } else if (patient) {
      const age = new Date().getFullYear() - new Date(patient.dob).getFullYear();
      const medications = Array.isArray(patient.current_medications) 
        ? patient.current_medications.join(', ') 
        : '';
      
      patientContext = `Patient Information:
Name: ${patient.name}
Age: ${age}
Medical History: ${patient.medical_history || 'None'}
Current Medications: ${medications || 'None'}`;
    }
  }

  // Get message history (first 3 messages for context)
  const { data: messages = [], error: messagesError } = await supabase
    .from('messages')
    .select('content, sender, type, sequence')
    .eq('chat_id', chatId)
    .order('sequence', { ascending: true })
    .limit(3);

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    throw new Error('Failed to fetch message history');
  }

  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
    type: msg.type
  }));

  console.log('Context assembly complete:', {
    hasTemplateInstructions: !!templateInstructions,
    hasPatientContext: !!patientContext,
    messageCount: messageHistory.length
  });

  return {
    templateInstructions,
    patientContext,
    messageHistory
  };
}