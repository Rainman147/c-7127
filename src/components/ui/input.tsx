import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isDob?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isDob, onChange, ...props }, ref) => {
    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDob) {
        onChange?.(e);
        return;
      }

      let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
      
      if (value.length > 8) {
        value = value.slice(0, 8);
      }
      
      // Format with slashes
      if (value.length >= 4) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
      } else if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }

      e.target.value = value;
      onChange?.(e);
    };

    return (
      <input
        type="text"
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
          className
        )}
        onChange={handleDateInput}
        placeholder={isDob ? "MM/DD/YYYY" : props.placeholder}
        maxLength={isDob ? 10 : props.maxLength}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }