import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-transparent",
          "border border-gray-700 border-opacity-50",
          "rounded-lg px-4 py-2.5", // Enhanced padding and more rounded corners
          "transition-all duration-200", // Smooth transitions
          "focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-opacity-50",
          "focus:border-opacity-75", // Increased border opacity on focus
          "placeholder:text-gray-400",
          "text-base", // Slightly larger text for better readability
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }