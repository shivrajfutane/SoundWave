import React from 'react'
import { cn } from './Button'

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("overflow-y-auto scrollbar-thin scrollbar-thumb-glass-border scrollbar-track-transparent", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = 'ScrollArea'
