"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  dialogOverlayStyles,
  dialogContentStyles,
  dialogHeaderStyles,
  dialogFooterStyles,
  dialogTitleStyles,
  dialogDescriptionStyles,
  getSizeClass
} from "./dialog-styles"

const StyledDialog = DialogPrimitive.Root
const StyledDialogTrigger = DialogPrimitive.Trigger
const StyledDialogPortal = DialogPrimitive.Portal

const StyledDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayStyles, className)}
    {...props}
  />
))
StyledDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const StyledDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, children, size = "md", ...props }, ref) => (
  <StyledDialogPortal>
    <StyledDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentStyles, getSizeClass(size), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </StyledDialogPortal>
))
StyledDialogContent.displayName = DialogPrimitive.Content.displayName

const StyledDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(dialogHeaderStyles, className)} {...props} />
)
StyledDialogHeader.displayName = "StyledDialogHeader"

const StyledDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(dialogFooterStyles, className)} {...props} />
)
StyledDialogFooter.displayName = "StyledDialogFooter"

const StyledDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(dialogTitleStyles, className)}
    {...props}
  />
))
StyledDialogTitle.displayName = DialogPrimitive.Title.displayName

const StyledDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(dialogDescriptionStyles, className)}
    {...props}
  />
))
StyledDialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  StyledDialog,
  StyledDialogTrigger,
  StyledDialogContent,
  StyledDialogHeader,
  StyledDialogFooter,
  StyledDialogTitle,
  StyledDialogDescription,
}