import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isDob?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isDob, onChange, ...props }, ref) => {
    // Convert type="date" to text input with formatting if isDob is true
    const inputType = isDob ? "text" : type;
    
    const formatDateString = (value: string) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      
      // Add slashes after MM and DD
      let formatted = '';
      if (digits.length > 0) formatted += digits.slice(0, 2);
      if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
      if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
      
      return formatted;
    };

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDob) {
        onChange?.(e);
        return;
      }

      const input = e.target;
      const cursorPosition = input.selectionStart;
      const previousValue = input.value;
      
      // Format the new value
      const formatted = formatDateString(input.value);
      
      // Only update if the format is different
      if (formatted !== previousValue) {
        // Create a new synthetic event with the formatted value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted
          }
        } as React.ChangeEvent<HTMLInputElement>;

        // Update the input value
        input.value = formatted;
        
        // Call the original onChange
        onChange?.(syntheticEvent);
        
        // Restore cursor position, accounting for added slashes
        requestAnimationFrame(() => {
          let newPosition = cursorPosition;
          // If we just added a slash, move cursor one position forward
          if (formatted.length > previousValue.length && formatted[cursorPosition - 1] === '/') {
            newPosition++;
          }
          input.setSelectionRange(newPosition, newPosition);
        });
      }
    };

    return (
      <input
        type={inputType}
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