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
          "rounded-md px-4 py-2.5",
          "transition-all duration-200",
          "focus:outline-none focus:bg-chatgpt-hover",
          "focus:border-chatgpt-border/50 focus:border-opacity-75",
          "hover:border-chatgpt-border/30",
          "placeholder:text-gray-400",
          "text-base",
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