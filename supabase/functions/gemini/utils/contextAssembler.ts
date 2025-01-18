import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatContext } from '../types.ts';

const MAX_MESSAGES = 10; // Limit chat history to last 10 messages
const CRITICAL_CONTEXT_THRESHOLD = 3; // Keep first 3 messages for context

export async function getMessageSequence(supabase: any, chatId: string): Promise<number> {
  console.log('Fetching message sequence for chat:', chatId);
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
  console.log('Fetching optimized chat history for:', chatId);
  
  // First, get total message count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('chat_id', chatId);

  // If we have more messages than our limit, fetch both early and recent context
  if (count > MAX_MESSAGES) {
    console.log(`Chat has ${count} messages, optimizing context...`);
    
    // Fetch critical early context
    const { data: earlyContext, error: earlyError } = await supabase
      .from('messages')
      .select('content, sender, type, sequence')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: true })
      .limit(CRITICAL_CONTEXT_THRESHOLD);

    if (earlyError) {
      console.error('Error fetching early context:', earlyError);
      throw new Error('Failed to fetch chat history');
    }

    // Fetch recent messages
    const { data: recentMessages, error: recentError } = await supabase
      .from('messages')
      .select('content, sender, type, sequence')
      .eq('chat_id', chatId)
      .order('sequence', { ascending: true })
      .range(count - (MAX_MESSAGES - CRITICAL_CONTEXT_THRESHOLD), count - 1);

    if (recentError) {
      console.error('Error fetching recent messages:', recentError);
      throw new Error('Failed to fetch chat history');
    }

    // Combine early context with recent messages
    const optimizedHistory = [...earlyContext, ...recentMessages];
    console.log(`Optimized history: ${optimizedHistory.length} messages (${earlyContext.length} early + ${recentMessages.length} recent)`);
    
    return optimizedHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      type: msg.type,
      sequence: msg.sequence
    }));
  }

  // If under limit, fetch all messages
  const { data, error } = await supabase
    .from('messages')
    .select('content, sender, type, sequence')
    .eq('chat_id', chatId)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw new Error('Failed to fetch chat history');
  }

  console.log(`Fetched ${data.length} messages (under limit)`);
  return data.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
    type: msg.type,
    sequence: msg.sequence
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