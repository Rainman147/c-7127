import { useState, useEffect } from 'react';
import { useUI } from '@/contexts/UIContext';
import { ChatHeader } from '@/features/chat/components/header/ChatHeader';
import MessageList from '@/features/chat/components/message/MessageList';
import ChatInput from '@/features/chat/components/input/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { formatPatientContext } from '@/types/patient';
import type { Message, Template, Patient, PatientContext } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  currentChatId: string | null;
  onMessageSend: (content: string, type?: 'text' | 'audio', systemInstructions?: string) => Promise<void>;
  onTranscriptionComplete: (text: string) => Promise<void>;
  onTemplateChange: (template: Template) => void;
  onPatientSelect: (patientId: string | null) => Promise<void>;
  selectedPatientId: string | null;
}

const ChatContainer = ({ 
  messages, 
  isLoading,
  currentChatId,
  onMessageSend,
  onTranscriptionComplete,
  onTemplateChange,
  onPatientSelect,
  selectedPatientId
}: ChatContainerProps) => {
  console.log('[ChatContainer] Rendering with messages:', messages, 'currentChatId:', currentChatId);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);

  const handleTranscriptionUpdate = (text: string) => {
    console.log('[ChatContainer] Transcription update:', text);
    setTranscriptionText(text);
  };

  // Fetch and format patient context when selectedPatientId changes
  useEffect(() => {
    const loadPatientContext = async () => {
      if (!selectedPatientId) {
        setPatientContext(null);
        return;
      }

      try {
        const { data: patient, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', selectedPatientId)
          .single();

        if (error) throw error;

        const formattedContext = formatPatientContext(patient);
        console.log('[ChatContainer] Loaded patient context:', formattedContext);
        setPatientContext(formattedContext);
      } catch (err) {
        console.error('[ChatContainer] Error loading patient context:', err);
        setPatientContext(null);
      }
    };

    loadPatientContext();
  }, [selectedPatientId]);

  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          currentChatId={currentChatId} 
          onTemplateChange={onTemplateChange}
          onPatientSelect={onPatientSelect}
          selectedPatientId={selectedPatientId}
        />
        
        {/* Messages Container - Takes remaining height with overflow */}
        <div className="flex-1 overflow-hidden">
          {/* Scrollable Area with Padding Space */}
          <div className="h-full relative">
            {/* Content Container */}
            <div className="absolute inset-0 overflow-y-auto chat-scrollbar">
              {/* Message Width Container */}
              <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8">
                <div className="pt-[60px] pb-[100px]">
                  <MessageList messages={messages} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section - Fixed at bottom */}
        <div className="relative w-full bg-gradient-to-t from-chatgpt-main via-chatgpt-main to-transparent pb-3 pt-6">
          <div className="px-4 sm:px-6 md:px-8">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={onMessageSend}
                onTranscriptionComplete={onTranscriptionComplete}
                onTranscriptionUpdate={handleTranscriptionUpdate}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;