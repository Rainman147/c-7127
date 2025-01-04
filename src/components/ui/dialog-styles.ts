import { cn } from "@/lib/utils";

export const dialogOverlayStyles = cn(
  "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
);

export const dialogContentStyles = cn(
  // Positioning
  "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
  // Width and padding (responsive)
  "w-full px-4 sm:px-6",
  // Colors and effects
  "bg-chatgpt-main text-gray-100 shadow-2xl rounded-lg", // Updated background and added rounded corners
  // Animations
  "duration-300",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100",
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
);

export const dialogHeaderStyles = cn(
  "flex flex-col space-y-1.5 border-b border-gray-700 pb-4"
);

export const dialogFooterStyles = cn(
  "flex justify-end gap-2 mt-4 border-t border-gray-700 pt-4"
);

export const dialogTitleStyles = cn(
  "text-lg font-semibold leading-none tracking-tight"
);

export const dialogDescriptionStyles = cn(
  "text-sm text-muted-foreground"
);

// Input field styles for modals with modern, rounded design
export const dialogInputStyles = cn(
  "w-full bg-transparent",
  "border border-gray-700 border-opacity-50",
  "rounded-lg px-4 py-2.5",
  "transition-all duration-200",
  "focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-opacity-50",
  "focus:border-opacity-75",
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