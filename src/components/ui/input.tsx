import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDateInput = type === 'date';
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    const handleCalendarClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!inputRef.current) return;
      
      try {
        // Try using the modern showPicker API
        if ('showPicker' in HTMLInputElement.prototype) {
          await inputRef.current.showPicker();
        } else {
          // Fallback: Focus the input which will usually trigger the native picker
          inputRef.current.focus();
          // Some browsers need a click to show the picker
          inputRef.current.click();
        }
      } catch (error) {
        console.log('Date picker not supported in this browser, falling back to focus:', error);
        // Final fallback: just focus the input
        inputRef.current.focus();
      }
    };
    
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "w-full bg-transparent",
            "border border-chatgpt-border/20",
            "rounded px-4 py-2.5",
            "transition-colors duration-200",
            "focus:outline-none focus-visible:ring-0",
            "focus:border-chatgpt-border/70",
            "hover:border-chatgpt-border/30",
            "placeholder:text-gray-400",
            "text-base",
            // Hide native calendar picker icon for date inputs
            isDateInput && "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute",
            className
          )}
          ref={(element) => {
            // Forward the ref while also maintaining our local ref
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
            inputRef.current = element;
          }}
          {...props}
        />
        {isDateInput && (
          <Calendar 
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer" 
            onClick={handleCalendarClick}
            aria-label="Open date picker"
            role="button"
            tabIndex={0}
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }