import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedScrollContainerProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export const OptimizedScrollContainer = ({ 
  children, 
  className,
  maxHeight = "h-96"
}: OptimizedScrollContainerProps) => {
  return (
    <div className={cn(
      "overflow-y-auto scrollbar-hide mobile-scroll",
      maxHeight,
      className
    )}>
      {children}
    </div>
  );
};