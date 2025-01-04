import * as React from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDateInput = type === 'date';
    
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
          ref={ref}
          {...props}
        />
        {isDateInput && (
          <Calendar 
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
            aria-hidden="true"
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }