import { cn } from "@/lib/utils";

export const dialogOverlayStyles = cn(
  "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
);

export const dialogContentStyles = cn(
  // Positioning
  "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
  // Width and padding
  "w-full px-6 sm:px-6",
  // Colors and borders
  "bg-chatgpt-main border border-chatgpt-border/20 rounded-xl",
  // Scrollbar styling
  "scrollbar-thin",
  "scrollbar-track-chatgpt-main",
  "scrollbar-thumb-gray-500/50",
  "hover:scrollbar-thumb-gray-400/50",
  "scrollbar-thumb-rounded",
  // Animations
  "duration-300",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100",
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
);

export const dialogHeaderStyles = cn(
  "flex flex-col space-y-1.5 border-b border-chatgpt-border/20",
  "pt-6 px-6 pb-4 mb-4"
);

export const dialogFooterStyles = cn(
  "flex justify-end gap-2 mt-4 border-t border-chatgpt-border/20",
  "px-6 pt-4 pb-6"
);

export const dialogTitleStyles = cn(
  "text-lg font-semibold leading-none tracking-tight"
);

export const dialogDescriptionStyles = cn(
  "text-sm text-muted-foreground"
);

// Input field styles for modals
export const dialogInputStyles = cn(
  "w-full bg-chatgpt-main",
  "border border-chatgpt-border/20",
  "rounded-md px-3 py-2",
  "transition-all duration-200",
  "hover:border-chatgpt-border/30",
  "focus:bg-chatgpt-hover focus:border-chatgpt-border/50",
  "focus-within:bg-chatgpt-hover focus-within:border-chatgpt-border/50",
  "focus:outline-none",
  "placeholder:text-gray-400",
  "text-base"
);

export const getSizeClass = (size: "sm" | "md" | "lg" = "md") => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl"
  };
  return sizeClasses[size];
};