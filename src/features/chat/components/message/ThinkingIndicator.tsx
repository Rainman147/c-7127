
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
              <div className="inline-flex items-center">
                <span 
                  className="text-base bg-gradient-to-r from-gray-300/80 via-white to-gray-300/80 
                            text-transparent bg-clip-text animate-text-shimmer 
                            bg-[length:200%_100%]"
                >
                  Thinking
                </span>
                <div className="flex gap-1 ml-2">
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-gray-200 to-white/90 animate-dot-glow delay-[600ms] transition-all" />
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-gray-200 to-white/90 animate-dot-glow delay-[750ms] transition-all" />
                  <div className="w-1 h-1 rounded-full bg-gradient-to-r from-gray-200 to-white/90 animate-dot-glow delay-[900ms] transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
