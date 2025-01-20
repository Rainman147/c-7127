import { ChatContext } from '../types.ts';

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

export async function assembleContext(supabase: any, chatId: string): Promise<ChatContext> {
  console.log('[contextAssembler] Assembling context for chat:', chatId);
  
  // Get basic chat info
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('template_type, patient_id')
    .eq('id', chatId)
    .maybeSingle();

  if (chatError) {
    console.error('[contextAssembler] Error fetching chat:', chatError);
    throw new Error('Failed to fetch chat details');
  }

  // Get template instructions if exists
  let systemInstructions = DEFAULT_INSTRUCTIONS;
  if (chat?.template_type) {
    const { data: template } = await supabase
      .from('templates')
      .select('system_instructions')
      .eq('id', chat.template_type)
      .maybeSingle();
    
    if (template?.system_instructions) {
      systemInstructions = template.system_instructions;
    }
  }

  // Get patient context if exists
  let patientContext = null;
  if (chat?.patient_id) {
    const { data: patient } = await supabase
      .from('patients')
      .select('name, dob, medical_history, current_medications')
      .eq('id', chat.patient_id)
      .maybeSingle();

    if (patient) {
      patientContext = `Patient Information:
Name: ${patient.name}
Age: ${calculateAge(patient.dob)}
Medical History: ${patient.medical_history || 'None'}
Current Medications: ${formatMedications(patient.current_medications)}`.trim();
    }
  }

  // Get recent message history
  const { data: messages = [], error: messagesError } = await supabase
    .from('messages')
    .select('content, sender, type')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(3);

  if (messagesError) {
    console.error('[contextAssembler] Error fetching messages:', messagesError);
    throw new Error('Failed to fetch message history');
  }

  const messageHistory = messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
    type: msg.type
  }));

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
}