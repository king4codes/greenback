import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-lg border-2 shadow-lg overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#463831] before:to-[#2B1810]",
      "after:absolute after:inset-0 after:bg-black/10 after:pointer-events-none",
      "border-[#382418]",
      className
    )}
    {...props}
  >
    {/* Decorative corner elements */}
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#5C4A3D] rounded-tl-sm" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#5C4A3D] rounded-tr-sm" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#241610] rounded-bl-sm" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#241610] rounded-br-sm" />
    
    {/* Inner content container */}
    <div className="relative z-10">
      {props.children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      "border-b border-[#2B1810]",
      "bg-gradient-to-b from-[#463831]/50 to-transparent",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-runescape leading-none tracking-tight text-[#FFD700]",
      "drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm text-[#C0C0C0]",
      "drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "p-6 pt-0",
      "relative z-10",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      "border-t border-[#2B1810]",
      "bg-gradient-to-t from-[#463831]/50 to-transparent",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
