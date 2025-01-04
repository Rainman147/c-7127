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
  "bg-gray-900 text-gray-100 shadow-2xl",
  // Animations
  "duration-300",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100",
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  // Responsive design
  "sm:rounded-lg"
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

export const getSizeClass = (size: "sm" | "md" | "lg" = "md") => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl"
  };
  return sizeClasses[size];
};