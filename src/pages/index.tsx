import { useParams } from 'react-router-dom';
import ChatView from './Chat/components/ChatView';
import { useAudioRecovery } from '@/hooks/transcription/useAudioRecovery';

const Index = () => {
  console.log('[Index] Component initializing');
  const { sessionId } = useParams();
  
  // Initialize audio recovery
  useAudioRecovery();

  return <ChatView sessionId={sessionId} />;
};

export default Index;