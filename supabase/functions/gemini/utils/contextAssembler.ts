import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatContext } from '../types.ts';

const MAX_HISTORY_MESSAGES = 10; // Limit chat history

export async function getMessageSequence(supabase: any, chatId: string): Promise<number> {
  const { data, error } = await supabase
    .from('messages')
    .select('sequence')
    .eq('chat_id', chatId)
    .order('sequence', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching message sequence:', error);
    return 0;
  }

  return (data?.sequence || 0) + 1;
}

async function fetchChatContext(supabase: any, chatId: string) {
  console.log('Fetching chat context for:', chatId);
  const { data, error } = await supabase
    .from('chats')
    .select('template_type, patient_id')
    .eq('id', chatId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching chat context:', error);
    throw new Error('Failed to fetch chat context');
  }

  return {
    templateType: data?.template_type,
    patientId: data?.patient_id
  };
}

async function fetchPatientContext(supabase: any, patientId: string): Promise<string> {
  console.log('Fetching patient context for:', patientId);
  const { data, error } = await supabase
    .from('patients')
    .select('name, dob, medical_history, current_medications')
    .eq('id', patientId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching patient context:', error);
    throw new Error('Failed to fetch patient context');
  }

  if (!data) return '';

  const age = new Date().getFullYear() - new Date(data.dob).getFullYear();
  const medications = Array.isArray(data.current_medications) ? data.current_medications.join(', ') : '';
  
  return `Patient Information:
    Name: ${data.name}
    Age: ${age}
    Medical History: ${data.medical_history || 'None'}
    Current Medications: ${medications || 'None'}`;
}

async function fetchTemplateContext(supabase: any, chatId: string): Promise<string> {
  console.log('Fetching template context for:', chatId);
  const { data, error } = await supabase
    .from('template_contexts')
    .select('system_instructions')
    .eq('chat_id', chatId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching template context:', error);
    throw new Error('Failed to fetch template context');
  }

  return data?.system_instructions || '';
}

async function fetchChatHistory(supabase: any, chatId: string) {
  console.log('Fetching chat history for:', chatId);
  const { data, error } = await supabase
    .from('messages')
    .select('content, sender, type')
    .eq('chat_id', chatId)
    .order('sequence', { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);

  if (error) {
    console.error('Error fetching chat history:', error);
    throw new Error('Failed to fetch chat history');
  }

  return data.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
    type: msg.type
  }));
}

export async function assembleContext(supabase: any, chatId: string): Promise<ChatContext> {
  console.log('Assembling context for chat:', chatId);
  
  const { templateType, patientId } = await fetchChatContext(supabase, chatId);
  
  const [templateInstructions, messageHistory, patientContext] = await Promise.all([
    templateType ? fetchTemplateContext(supabase, chatId) : Promise.resolve(''),
    fetchChatHistory(supabase, chatId),
    patientId ? fetchPatientContext(supabase, patientId) : Promise.resolve('')
  ]);

  return {
    templateInstructions,
    patientContext,
    messageHistory
  };
}