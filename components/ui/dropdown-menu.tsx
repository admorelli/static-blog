'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative z-10', className)}
    {...props}
  />
));
DropdownMenu.displayName = 'DropdownMenu';

export { DropdownMenu };
