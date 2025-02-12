
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
            <div className="flex items-center gap-2">
              <span 
                className="text-base bg-gradient-to-r from-transparent via-white to-transparent 
                          bg-[length:200%_100%] animate-shimmer inline-flex items-center"
              >
                Thinking
                <span className="flex gap-1 ml-2">
                  <span className="w-1 h-1 rounded-full bg-current animate-dot-scale delay-[0ms]">.</span>
                  <span className="w-1 h-1 rounded-full bg-current animate-dot-scale delay-[150ms]">.</span>
                  <span className="w-1 h-1 rounded-full bg-current animate-dot-scale delay-[300ms]">.</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
