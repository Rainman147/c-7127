import { Loader2 } from 'lucide-react';

export const MessageLoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p>Loading messages...</p>
    </div>
  );
};