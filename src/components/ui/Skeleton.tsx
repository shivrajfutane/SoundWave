import { cn } from './Button'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-glass-border/50", className)}
      {...props}
    />
  )
}
