import React from 'react';
import { cn } from '@/utils/cn.js';

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-muted/50',
  ghost: 'hover:bg-muted/50',
};

const sizeVariants = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-6 text-base',
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        sizeVariants[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button };
