import { useNavigate } from 'react-router-dom';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface PatientChatHistoryProps {
  chats: Chat[];
}

export const PatientChatHistory = ({ chats }: PatientChatHistoryProps) => {
  const navigate = useNavigate();

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Recent Chat Sessions</h2>
      <div className="space-y-2">
        {chats.map((chat) => (
          <div 
            key={chat.id}
            className="p-4 border rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
            onClick={() => navigate(`/chat/${chat.id}`)}
          >
            <p className="font-medium">{chat.title}</p>
            <p className="text-sm text-gray-400">
              {new Date(chat.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {chats.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            No chat sessions found
          </div>
        )}
      </div>
    </div>
  );
};