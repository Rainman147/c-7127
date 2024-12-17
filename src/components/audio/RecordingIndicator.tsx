import { memo } from 'react';

const RecordingIndicator = memo(() => (
  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
    <span className="hidden sm:inline">Recording in session</span>
    <span className="inline sm:hidden">Recording</span>
    <span className="flex gap-0.5">
      <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
  </div>
));

RecordingIndicator.displayName = 'RecordingIndicator';

export default RecordingIndicator;