import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
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
          "min-h-[100px]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }