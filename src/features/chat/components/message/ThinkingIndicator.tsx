
import { cn } from '@/lib/utils';
import MessageAvatar from './MessageAvatar';

const ThinkingIndicator = () => {
  console.log('[ThinkingIndicator] Rendering thinking indicator');
  
  return (
    <div className="group relative px-4 py-6 text-gray-100">
      <div className="relative m-auto flex flex-col gap-4 px-4 max-w-3xl">
        <div className="flex gap-4 w-full">
          <MessageAvatar role="assistant" />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-base">Thinking</span>
              <span className="flex gap-1">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse delay-150">.</span>
                <span className="animate-pulse delay-300">.</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
