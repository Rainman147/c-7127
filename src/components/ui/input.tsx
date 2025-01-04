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
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }